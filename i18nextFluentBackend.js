(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.i18nextFluentBackend = factory());
}(this, (function () { 'use strict';

  let arr = [];
  let each = arr.forEach;
  let slice = arr.slice;
  function defaults(obj) {
    each.call(slice.call(arguments, 1), function (source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === undefined) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }

  function addQueryString(url, params) {
    if (params && typeof params === 'object') {
      let queryString = '',
          e = encodeURIComponent; // Must encode data

      for (let paramName in params) {
        queryString += '&' + e(paramName) + '=' + e(params[paramName]);
      }

      if (!queryString) {
        return url;
      }

      url = url + (url.indexOf('?') !== -1 ? '&' : '?') + queryString.slice(1);
    }

    return url;
  } // https://gist.github.com/Xeoncross/7663273


  function ajax(url, options, callback, data, cache) {
    if (data && typeof data === 'object') {
      if (!cache) {
        data['_t'] = new Date();
      } // URL encoded form data must be in querystring format


      data = addQueryString('', data).slice(1);
    }

    if (options.queryStringParams) {
      url = addQueryString(url, options.queryStringParams);
    }

    try {
      var x;

      if (XMLHttpRequest) {
        x = new XMLHttpRequest();
      } else {
        x = new ActiveXObject('MSXML2.XMLHTTP.3.0');
      }

      x.open(data ? 'POST' : 'GET', url, 1);

      if (!options.crossDomain) {
        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      }

      x.withCredentials = !!options.withCredentials;

      if (data) {
        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }

      if (x.overrideMimeType) {
        x.overrideMimeType("application/json");
      }

      var h = options.customHeaders;

      if (h) {
        for (var i in h) {
          x.setRequestHeader(i, h[i]);
        }
      }

      x.onreadystatechange = function () {
        x.readyState > 3 && callback && callback(x.responseText, x);
      };

      x.send(data);
    } catch (e) {
      console && console.log(e);
    }
  }

  /*
   * Base class for all Fluent AST nodes.
   *
   * All productions described in the ASDL subclass BaseNode, including Span and
   * Annotation.
   *
   */
  class BaseNode {
    constructor() {
      this.type = "BaseNode";
    }

    equals(other, ignoredFields = ["span"]) {
      const thisKeys = new Set(Object.keys(this));
      const otherKeys = new Set(Object.keys(other));

      if (ignoredFields) {
        for (const fieldName of ignoredFields) {
          thisKeys.delete(fieldName);
          otherKeys.delete(fieldName);
        }
      }

      if (thisKeys.size !== otherKeys.size) {
        return false;
      }

      for (const fieldName of thisKeys) {
        if (!otherKeys.has(fieldName)) {
          return false;
        }

        const thisVal = this[fieldName];
        const otherVal = other[fieldName];

        if (typeof thisVal !== typeof otherVal) {
          return false;
        }

        if (thisVal instanceof Array && otherVal instanceof Array) {
          if (thisVal.length !== otherVal.length) {
            return false;
          }

          for (let i = 0; i < thisVal.length; ++i) {
            if (!scalarsEqual(thisVal[i], otherVal[i], ignoredFields)) {
              return false;
            }
          }
        } else if (!scalarsEqual(thisVal, otherVal, ignoredFields)) {
          return false;
        }
      }

      return true;
    }

    clone() {
      function visit(value) {
        if (value instanceof BaseNode) {
          return value.clone();
        }

        if (Array.isArray(value)) {
          return value.map(visit);
        }

        return value;
      }

      const clone = Object.create(this.constructor.prototype);

      for (const prop of Object.keys(this)) {
        clone[prop] = visit(this[prop]);
      }

      return clone;
    }

  }

  function scalarsEqual(thisVal, otherVal, ignoredFields) {
    if (thisVal instanceof BaseNode && otherVal instanceof BaseNode) {
      return thisVal.equals(otherVal, ignoredFields);
    }

    return thisVal === otherVal;
  }
  /*
   * Base class for AST nodes which can have Spans.
   */


  class SyntaxNode extends BaseNode {
    constructor() {
      super(...arguments);
      this.type = "SyntaxNode";
    }

    addSpan(start, end) {
      this.span = new Span(start, end);
    }

  }
  class Resource extends SyntaxNode {
    constructor(body = []) {
      super();
      this.type = "Resource";
      this.body = body;
    }

  }
  /*
   * An abstract base class for useful elements of Resource.body.
   */

  class Entry extends SyntaxNode {
    constructor() {
      super(...arguments);
      this.type = "Entry";
    }

  }
  class Message extends Entry {
    constructor(id, value = null, attributes = [], comment = null) {
      super();
      this.type = "Message";
      this.id = id;
      this.value = value;
      this.attributes = attributes;
      this.comment = comment;
    }

  }
  class Term extends Entry {
    constructor(id, value, attributes = [], comment = null) {
      super();
      this.type = "Term";
      this.id = id;
      this.value = value;
      this.attributes = attributes;
      this.comment = comment;
    }

  }
  class Pattern extends SyntaxNode {
    constructor(elements) {
      super();
      this.type = "Pattern";
      this.elements = elements;
    }

  }
  /*
   * An abstract base class for elements of Patterns.
   */

  class PatternElement extends SyntaxNode {
    constructor() {
      super(...arguments);
      this.type = "PatternElement";
    }

  }
  class TextElement extends PatternElement {
    constructor(value) {
      super();
      this.type = "TextElement";
      this.value = value;
    }

  }
  class Placeable extends PatternElement {
    constructor(expression) {
      super();
      this.type = "Placeable";
      this.expression = expression;
    }

  }
  /*
   * An abstract base class for expressions.
   */

  class Expression extends SyntaxNode {
    constructor() {
      super(...arguments);
      this.type = "Expression";
    }

  } // An abstract base class for Literals.

  class Literal extends Expression {
    constructor(value) {
      super();
      this.type = "Literal"; // The "value" field contains the exact contents of the literal,
      // character-for-character.

      this.value = value;
    }

  }
  class StringLiteral extends Literal {
    constructor() {
      super(...arguments);
      this.type = "StringLiteral";
    }

    parse() {
      // Backslash backslash, backslash double quote, uHHHH, UHHHHHH.
      const KNOWN_ESCAPES = /(?:\\\\|\\"|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;

      function fromEscapeSequence(match, codepoint4, codepoint6) {
        switch (match) {
          case "\\\\":
            return "\\";

          case "\\\"":
            return "\"";

          default:
            {
              let codepoint = parseInt(codepoint4 || codepoint6, 16);

              if (codepoint <= 0xD7FF || 0xE000 <= codepoint) {
                // It's a Unicode scalar value.
                return String.fromCodePoint(codepoint);
              } // Escape sequences reresenting surrogate code points are
              // well-formed but invalid in Fluent. Replace them with U+FFFD
              // REPLACEMENT CHARACTER.


              return "�";
            }
        }
      }

      let value = this.value.replace(KNOWN_ESCAPES, fromEscapeSequence);
      return {
        value
      };
    }

  }
  class NumberLiteral extends Literal {
    constructor() {
      super(...arguments);
      this.type = "NumberLiteral";
    }

    parse() {
      let value = parseFloat(this.value);
      let decimalPos = this.value.indexOf(".");
      let precision = decimalPos > 0 ? this.value.length - decimalPos - 1 : 0;
      return {
        value,
        precision
      };
    }

  }
  class MessageReference extends Expression {
    constructor(id, attribute = null) {
      super();
      this.type = "MessageReference";
      this.id = id;
      this.attribute = attribute;
    }

  }
  class TermReference extends Expression {
    constructor(id, attribute = null, args = null) {
      super();
      this.type = "TermReference";
      this.id = id;
      this.attribute = attribute;
      this.arguments = args;
    }

  }
  class VariableReference extends Expression {
    constructor(id) {
      super();
      this.type = "VariableReference";
      this.id = id;
    }

  }
  class FunctionReference extends Expression {
    constructor(id, args) {
      super();
      this.type = "FunctionReference";
      this.id = id;
      this.arguments = args;
    }

  }
  class SelectExpression extends Expression {
    constructor(selector, variants) {
      super();
      this.type = "SelectExpression";
      this.selector = selector;
      this.variants = variants;
    }

  }
  class CallArguments extends SyntaxNode {
    constructor(positional = [], named = []) {
      super();
      this.type = "CallArguments";
      this.positional = positional;
      this.named = named;
    }

  }
  class Attribute extends SyntaxNode {
    constructor(id, value) {
      super();
      this.type = "Attribute";
      this.id = id;
      this.value = value;
    }

  }
  class Variant extends SyntaxNode {
    constructor(key, value, def) {
      super();
      this.type = "Variant";
      this.key = key;
      this.value = value;
      this.default = def;
    }

  }
  class NamedArgument extends SyntaxNode {
    constructor(name, value) {
      super();
      this.type = "NamedArgument";
      this.name = name;
      this.value = value;
    }

  }
  class Identifier extends SyntaxNode {
    constructor(name) {
      super();
      this.type = "Identifier";
      this.name = name;
    }

  }
  class BaseComment extends Entry {
    constructor(content) {
      super();
      this.type = "BaseComment";
      this.content = content;
    }

  }
  class Comment extends BaseComment {
    constructor() {
      super(...arguments);
      this.type = "Comment";
    }

  }
  class GroupComment extends BaseComment {
    constructor() {
      super(...arguments);
      this.type = "GroupComment";
    }

  }
  class ResourceComment extends BaseComment {
    constructor() {
      super(...arguments);
      this.type = "ResourceComment";
    }

  }
  class Junk extends SyntaxNode {
    constructor(content) {
      super();
      this.type = "Junk";
      this.annotations = [];
      this.content = content;
    }

    addAnnotation(annotation) {
      this.annotations.push(annotation);
    }

  }
  class Span extends BaseNode {
    constructor(start, end) {
      super();
      this.type = "Span";
      this.start = start;
      this.end = end;
    }

  }
  class Annotation extends SyntaxNode {
    constructor(code, args = [], message) {
      super();
      this.type = "Annotation";
      this.code = code;
      this.arguments = args;
      this.message = message;
    }

  }

  class ParseError extends Error {
    constructor(code, ...args) {
      super();
      this.code = code;
      this.args = args;
      this.message = getErrorMessage(code, args);
    }

  }
  /* eslint-disable complexity */

  function getErrorMessage(code, args) {
    switch (code) {
      case "E0001":
        return "Generic error";

      case "E0002":
        return "Expected an entry start";

      case "E0003":
        {
          const [token] = args;
          return `Expected token: "${token}"`;
        }

      case "E0004":
        {
          const [range] = args;
          return `Expected a character from range: "${range}"`;
        }

      case "E0005":
        {
          const [id] = args;
          return `Expected message "${id}" to have a value or attributes`;
        }

      case "E0006":
        {
          const [id] = args;
          return `Expected term "-${id}" to have a value`;
        }

      case "E0007":
        return "Keyword cannot end with a whitespace";

      case "E0008":
        return "The callee has to be an upper-case identifier or a term";

      case "E0009":
        return "The argument name has to be a simple identifier";

      case "E0010":
        return "Expected one of the variants to be marked as default (*)";

      case "E0011":
        return 'Expected at least one variant after "->"';

      case "E0012":
        return "Expected value";

      case "E0013":
        return "Expected variant key";

      case "E0014":
        return "Expected literal";

      case "E0015":
        return "Only one variant can be marked as default (*)";

      case "E0016":
        return "Message references cannot be used as selectors";

      case "E0017":
        return "Terms cannot be used as selectors";

      case "E0018":
        return "Attributes of messages cannot be used as selectors";

      case "E0019":
        return "Attributes of terms cannot be used as placeables";

      case "E0020":
        return "Unterminated string expression";

      case "E0021":
        return "Positional arguments must not follow named arguments";

      case "E0022":
        return "Named arguments must be unique";

      case "E0024":
        return "Cannot access variants of a message.";

      case "E0025":
        {
          const [char] = args;
          return `Unknown escape sequence: \\${char}.`;
        }

      case "E0026":
        {
          const [sequence] = args;
          return `Invalid Unicode escape sequence: ${sequence}.`;
        }

      case "E0027":
        return "Unbalanced closing brace in TextElement.";

      case "E0028":
        return "Expected an inline expression";

      case "E0029":
        return "Expected simple expression as selector";

      default:
        return code;
    }
  }

  /* eslint no-magic-numbers: "off" */
  class ParserStream {
    constructor(string) {
      this.string = string;
      this.index = 0;
      this.peekOffset = 0;
    }

    charAt(offset) {
      // When the cursor is at CRLF, return LF but don't move the cursor.
      // The cursor still points to the EOL position, which in this case is the
      // beginning of the compound CRLF sequence. This ensures slices of
      // [inclusive, exclusive) continue to work properly.
      if (this.string[offset] === "\r" && this.string[offset + 1] === "\n") {
        return "\n";
      }

      return this.string[offset];
    }

    currentChar() {
      return this.charAt(this.index);
    }

    currentPeek() {
      return this.charAt(this.index + this.peekOffset);
    }

    next() {
      this.peekOffset = 0; // Skip over the CRLF as if it was a single character.

      if (this.string[this.index] === "\r" && this.string[this.index + 1] === "\n") {
        this.index++;
      }

      this.index++;
      return this.string[this.index];
    }

    peek() {
      // Skip over the CRLF as if it was a single character.
      if (this.string[this.index + this.peekOffset] === "\r" && this.string[this.index + this.peekOffset + 1] === "\n") {
        this.peekOffset++;
      }

      this.peekOffset++;
      return this.string[this.index + this.peekOffset];
    }

    resetPeek(offset = 0) {
      this.peekOffset = offset;
    }

    skipToPeek() {
      this.index += this.peekOffset;
      this.peekOffset = 0;
    }

  }
  const EOL = "\n";
  const EOF = undefined;
  const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];
  class FluentParserStream extends ParserStream {
    peekBlankInline() {
      const start = this.index + this.peekOffset;

      while (this.currentPeek() === " ") {
        this.peek();
      }

      return this.string.slice(start, this.index + this.peekOffset);
    }

    skipBlankInline() {
      const blank = this.peekBlankInline();
      this.skipToPeek();
      return blank;
    }

    peekBlankBlock() {
      let blank = "";

      while (true) {
        const lineStart = this.peekOffset;
        this.peekBlankInline();

        if (this.currentPeek() === EOL) {
          blank += EOL;
          this.peek();
          continue;
        }

        if (this.currentPeek() === EOF) {
          // Treat the blank line at EOF as a blank block.
          return blank;
        } // Any other char; reset to column 1 on this line.


        this.resetPeek(lineStart);
        return blank;
      }
    }

    skipBlankBlock() {
      const blank = this.peekBlankBlock();
      this.skipToPeek();
      return blank;
    }

    peekBlank() {
      while (this.currentPeek() === " " || this.currentPeek() === EOL) {
        this.peek();
      }
    }

    skipBlank() {
      this.peekBlank();
      this.skipToPeek();
    }

    expectChar(ch) {
      if (this.currentChar() === ch) {
        this.next();
        return;
      }

      throw new ParseError("E0003", ch);
    }

    expectLineEnd() {
      if (this.currentChar() === EOF) {
        // EOF is a valid line end in Fluent.
        return;
      }

      if (this.currentChar() === EOL) {
        this.next();
        return;
      } // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)


      throw new ParseError("E0003", "\u2424");
    }

    takeChar(f) {
      const ch = this.currentChar();

      if (ch === EOF) {
        return EOF;
      }

      if (f(ch)) {
        this.next();
        return ch;
      }

      return null;
    }

    isCharIdStart(ch) {
      if (ch === EOF) {
        return false;
      }

      const cc = ch.charCodeAt(0);
      return cc >= 97 && cc <= 122 || // a-z
      cc >= 65 && cc <= 90; // A-Z
    }

    isIdentifierStart() {
      return this.isCharIdStart(this.currentPeek());
    }

    isNumberStart() {
      const ch = this.currentChar() === "-" ? this.peek() : this.currentChar();

      if (ch === EOF) {
        this.resetPeek();
        return false;
      }

      const cc = ch.charCodeAt(0);
      const isDigit = cc >= 48 && cc <= 57; // 0-9

      this.resetPeek();
      return isDigit;
    }

    isCharPatternContinuation(ch) {
      if (ch === EOF) {
        return false;
      }

      return !SPECIAL_LINE_START_CHARS.includes(ch);
    }

    isValueStart() {
      // Inline Patterns may start with any char.
      const ch = this.currentPeek();
      return ch !== EOL && ch !== EOF;
    }

    isValueContinuation() {
      const column1 = this.peekOffset;
      this.peekBlankInline();

      if (this.currentPeek() === "{") {
        this.resetPeek(column1);
        return true;
      }

      if (this.peekOffset - column1 === 0) {
        return false;
      }

      if (this.isCharPatternContinuation(this.currentPeek())) {
        this.resetPeek(column1);
        return true;
      }

      return false;
    } // -1 - any
    //  0 - comment
    //  1 - group comment
    //  2 - resource comment


    isNextLineComment(level = -1) {
      if (this.currentChar() !== EOL) {
        return false;
      }

      let i = 0;

      while (i <= level || level === -1 && i < 3) {
        if (this.peek() !== "#") {
          if (i <= level && level !== -1) {
            this.resetPeek();
            return false;
          }

          break;
        }

        i++;
      } // The first char after #, ## or ###.


      const ch = this.peek();

      if (ch === " " || ch === EOL) {
        this.resetPeek();
        return true;
      }

      this.resetPeek();
      return false;
    }

    isVariantStart() {
      const currentPeekOffset = this.peekOffset;

      if (this.currentPeek() === "*") {
        this.peek();
      }

      if (this.currentPeek() === "[") {
        this.resetPeek(currentPeekOffset);
        return true;
      }

      this.resetPeek(currentPeekOffset);
      return false;
    }

    isAttributeStart() {
      return this.currentPeek() === ".";
    }

    skipToNextEntryStart(junkStart) {
      let lastNewline = this.string.lastIndexOf(EOL, this.index);

      if (junkStart < lastNewline) {
        // Last seen newline is _after_ the junk start. It's safe to rewind
        // without the risk of resuming at the same broken entry.
        this.index = lastNewline;
      }

      while (this.currentChar()) {
        // We're only interested in beginnings of line.
        if (this.currentChar() !== EOL) {
          this.next();
          continue;
        } // Break if the first char in this line looks like an entry start.


        const first = this.next();

        if (this.isCharIdStart(first) || first === "-" || first === "#") {
          break;
        }
      }
    }

    takeIDStart() {
      if (this.isCharIdStart(this.currentChar())) {
        const ret = this.currentChar();
        this.next();
        return ret;
      }

      throw new ParseError("E0004", "a-zA-Z");
    }

    takeIDChar() {
      const closure = ch => {
        const cc = ch.charCodeAt(0);
        return cc >= 97 && cc <= 122 || // a-z
        cc >= 65 && cc <= 90 || // A-Z
        cc >= 48 && cc <= 57 || // 0-9
        cc === 95 || cc === 45; // _-
      };

      return this.takeChar(closure);
    }

    takeDigit() {
      const closure = ch => {
        const cc = ch.charCodeAt(0);
        return cc >= 48 && cc <= 57; // 0-9
      };

      return this.takeChar(closure);
    }

    takeHexDigit() {
      const closure = ch => {
        const cc = ch.charCodeAt(0);
        return cc >= 48 && cc <= 57 // 0-9
        || cc >= 65 && cc <= 70 // A-F
        || cc >= 97 && cc <= 102; // a-f
      };

      return this.takeChar(closure);
    }

  }

  /*  eslint no-magic-numbers: [0]  */
  const trailingWSRe = /[ \t\n\r]+$/;

  function withSpan(fn) {
    return function (ps, ...args) {
      if (!this.withSpans) {
        return fn.call(this, ps, ...args);
      }

      const start = ps.index;
      const node = fn.call(this, ps, ...args); // Don't re-add the span if the node already has it. This may happen when
      // one decorated function calls another decorated function.

      if (node.span) {
        return node;
      }

      const end = ps.index;
      node.addSpan(start, end);
      return node;
    };
  }

  class FluentParser {
    constructor({
      withSpans = true
    } = {}) {
      this.withSpans = withSpans; // Poor man's decorators.

      /* eslint-disable @typescript-eslint/unbound-method */

      this.getComment = withSpan(this.getComment);
      this.getMessage = withSpan(this.getMessage);
      this.getTerm = withSpan(this.getTerm);
      this.getAttribute = withSpan(this.getAttribute);
      this.getIdentifier = withSpan(this.getIdentifier);
      this.getVariant = withSpan(this.getVariant);
      this.getNumber = withSpan(this.getNumber);
      this.getPattern = withSpan(this.getPattern);
      this.getTextElement = withSpan(this.getTextElement);
      this.getPlaceable = withSpan(this.getPlaceable);
      this.getExpression = withSpan(this.getExpression);
      this.getInlineExpression = withSpan(this.getInlineExpression);
      this.getCallArgument = withSpan(this.getCallArgument);
      this.getCallArguments = withSpan(this.getCallArguments);
      this.getString = withSpan(this.getString);
      this.getLiteral = withSpan(this.getLiteral);
      this.getComment = withSpan(this.getComment);
      /* eslint-enable @typescript-eslint/unbound-method */
    }

    parse(source) {
      const ps = new FluentParserStream(source);
      ps.skipBlankBlock();
      const entries = [];
      let lastComment = null;

      while (ps.currentChar()) {
        const entry = this.getEntryOrJunk(ps);
        const blankLines = ps.skipBlankBlock(); // Regular Comments require special logic. Comments may be attached to
        // Messages or Terms if they are followed immediately by them. However
        // they should parse as standalone when they're followed by Junk.
        // Consequently, we only attach Comments once we know that the Message
        // or the Term parsed successfully.

        if (entry instanceof Comment && blankLines.length === 0 && ps.currentChar()) {
          // Stash the comment and decide what to do with it in the next pass.
          lastComment = entry;
          continue;
        }

        if (lastComment) {
          if (entry instanceof Message || entry instanceof Term) {
            entry.comment = lastComment;

            if (this.withSpans) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              entry.span.start = entry.comment.span.start;
            }
          } else {
            entries.push(lastComment);
          } // In either case, the stashed comment has been dealt with; clear it.


          lastComment = null;
        } // No special logic for other types of entries.


        entries.push(entry);
      }

      const res = new Resource(entries);

      if (this.withSpans) {
        res.addSpan(0, ps.index);
      }

      return res;
    }
    /*
     * Parse the first Message or Term in `source`.
     *
     * Skip all encountered comments and start parsing at the first Message or
     * Term start. Return Junk if the parsing is not successful.
     *
     * Preceding comments are ignored unless they contain syntax errors
     * themselves, in which case Junk for the invalid comment is returned.
     */


    parseEntry(source) {
      const ps = new FluentParserStream(source);
      ps.skipBlankBlock();

      while (ps.currentChar() === "#") {
        const skipped = this.getEntryOrJunk(ps);

        if (skipped instanceof Junk) {
          // Don't skip Junk comments.
          return skipped;
        }

        ps.skipBlankBlock();
      }

      return this.getEntryOrJunk(ps);
    }

    getEntryOrJunk(ps) {
      const entryStartPos = ps.index;

      try {
        const entry = this.getEntry(ps);
        ps.expectLineEnd();
        return entry;
      } catch (err) {
        if (!(err instanceof ParseError)) {
          throw err;
        }

        let errorIndex = ps.index;
        ps.skipToNextEntryStart(entryStartPos);
        const nextEntryStart = ps.index;

        if (nextEntryStart < errorIndex) {
          // The position of the error must be inside of the Junk's span.
          errorIndex = nextEntryStart;
        } // Create a Junk instance


        const slice = ps.string.substring(entryStartPos, nextEntryStart);
        const junk = new Junk(slice);

        if (this.withSpans) {
          junk.addSpan(entryStartPos, nextEntryStart);
        }

        const annot = new Annotation(err.code, err.args, err.message);
        annot.addSpan(errorIndex, errorIndex);
        junk.addAnnotation(annot);
        return junk;
      }
    }

    getEntry(ps) {
      if (ps.currentChar() === "#") {
        return this.getComment(ps);
      }

      if (ps.currentChar() === "-") {
        return this.getTerm(ps);
      }

      if (ps.isIdentifierStart()) {
        return this.getMessage(ps);
      }

      throw new ParseError("E0002");
    }

    getComment(ps) {
      // 0 - comment
      // 1 - group comment
      // 2 - resource comment
      let level = -1;
      let content = "";

      while (true) {
        let i = -1;

        while (ps.currentChar() === "#" && i < (level === -1 ? 2 : level)) {
          ps.next();
          i++;
        }

        if (level === -1) {
          level = i;
        }

        if (ps.currentChar() !== EOL) {
          ps.expectChar(" ");
          let ch;

          while (ch = ps.takeChar(x => x !== EOL)) {
            content += ch;
          }
        }

        if (ps.isNextLineComment(level)) {
          content += ps.currentChar();
          ps.next();
        } else {
          break;
        }
      }

      let Comment$$1;

      switch (level) {
        case 0:
          Comment$$1 = Comment;
          break;

        case 1:
          Comment$$1 = GroupComment;
          break;

        default:
          Comment$$1 = ResourceComment;
      }

      return new Comment$$1(content);
    }

    getMessage(ps) {
      const id = this.getIdentifier(ps);
      ps.skipBlankInline();
      ps.expectChar("=");
      const value = this.maybeGetPattern(ps);
      const attrs = this.getAttributes(ps);

      if (value === null && attrs.length === 0) {
        throw new ParseError("E0005", id.name);
      }

      return new Message(id, value, attrs);
    }

    getTerm(ps) {
      ps.expectChar("-");
      const id = this.getIdentifier(ps);
      ps.skipBlankInline();
      ps.expectChar("=");
      const value = this.maybeGetPattern(ps);

      if (value === null) {
        throw new ParseError("E0006", id.name);
      }

      const attrs = this.getAttributes(ps);
      return new Term(id, value, attrs);
    }

    getAttribute(ps) {
      ps.expectChar(".");
      const key = this.getIdentifier(ps);
      ps.skipBlankInline();
      ps.expectChar("=");
      const value = this.maybeGetPattern(ps);

      if (value === null) {
        throw new ParseError("E0012");
      }

      return new Attribute(key, value);
    }

    getAttributes(ps) {
      const attrs = [];
      ps.peekBlank();

      while (ps.isAttributeStart()) {
        ps.skipToPeek();
        const attr = this.getAttribute(ps);
        attrs.push(attr);
        ps.peekBlank();
      }

      return attrs;
    }

    getIdentifier(ps) {
      let name = ps.takeIDStart();
      let ch;

      while (ch = ps.takeIDChar()) {
        name += ch;
      }

      return new Identifier(name);
    }

    getVariantKey(ps) {
      const ch = ps.currentChar();

      if (ch === EOF) {
        throw new ParseError("E0013");
      }

      const cc = ch.charCodeAt(0);

      if (cc >= 48 && cc <= 57 || cc === 45) {
        // 0-9, -
        return this.getNumber(ps);
      }

      return this.getIdentifier(ps);
    }

    getVariant(ps, hasDefault = false) {
      let defaultIndex = false;

      if (ps.currentChar() === "*") {
        if (hasDefault) {
          throw new ParseError("E0015");
        }

        ps.next();
        defaultIndex = true;
      }

      ps.expectChar("[");
      ps.skipBlank();
      const key = this.getVariantKey(ps);
      ps.skipBlank();
      ps.expectChar("]");
      const value = this.maybeGetPattern(ps);

      if (value === null) {
        throw new ParseError("E0012");
      }

      return new Variant(key, value, defaultIndex);
    }

    getVariants(ps) {
      const variants = [];
      let hasDefault = false;
      ps.skipBlank();

      while (ps.isVariantStart()) {
        const variant = this.getVariant(ps, hasDefault);

        if (variant.default) {
          hasDefault = true;
        }

        variants.push(variant);
        ps.expectLineEnd();
        ps.skipBlank();
      }

      if (variants.length === 0) {
        throw new ParseError("E0011");
      }

      if (!hasDefault) {
        throw new ParseError("E0010");
      }

      return variants;
    }

    getDigits(ps) {
      let num = "";
      let ch;

      while (ch = ps.takeDigit()) {
        num += ch;
      }

      if (num.length === 0) {
        throw new ParseError("E0004", "0-9");
      }

      return num;
    }

    getNumber(ps) {
      let value = "";

      if (ps.currentChar() === "-") {
        ps.next();
        value += `-${this.getDigits(ps)}`;
      } else {
        value += this.getDigits(ps);
      }

      if (ps.currentChar() === ".") {
        ps.next();
        value += `.${this.getDigits(ps)}`;
      }

      return new NumberLiteral(value);
    } // maybeGetPattern distinguishes between patterns which start on the same line
    // as the identifier (a.k.a. inline signleline patterns and inline multiline
    // patterns) and patterns which start on a new line (a.k.a. block multiline
    // patterns). The distinction is important for the dedentation logic: the
    // indent of the first line of a block pattern must be taken into account when
    // calculating the maximum common indent.


    maybeGetPattern(ps) {
      ps.peekBlankInline();

      if (ps.isValueStart()) {
        ps.skipToPeek();
        return this.getPattern(ps, false);
      }

      ps.peekBlankBlock();

      if (ps.isValueContinuation()) {
        ps.skipToPeek();
        return this.getPattern(ps, true);
      }

      return null;
    }

    getPattern(ps, isBlock) {
      const elements = [];
      let commonIndentLength;

      if (isBlock) {
        // A block pattern is a pattern which starts on a new line. Store and
        // measure the indent of this first line for the dedentation logic.
        const blankStart = ps.index;
        const firstIndent = ps.skipBlankInline();
        elements.push(this.getIndent(ps, firstIndent, blankStart));
        commonIndentLength = firstIndent.length;
      } else {
        commonIndentLength = Infinity;
      }

      let ch;

      elements: while (ch = ps.currentChar()) {
        switch (ch) {
          case EOL:
            {
              const blankStart = ps.index;
              const blankLines = ps.peekBlankBlock();

              if (ps.isValueContinuation()) {
                ps.skipToPeek();
                const indent = ps.skipBlankInline();
                commonIndentLength = Math.min(commonIndentLength, indent.length);
                elements.push(this.getIndent(ps, blankLines + indent, blankStart));
                continue elements;
              } // The end condition for getPattern's while loop is a newline
              // which is not followed by a valid pattern continuation.


              ps.resetPeek();
              break elements;
            }

          case "{":
            elements.push(this.getPlaceable(ps));
            continue elements;

          case "}":
            throw new ParseError("E0027");

          default:
            elements.push(this.getTextElement(ps));
        }
      }

      const dedented = this.dedent(elements, commonIndentLength);
      return new Pattern(dedented);
    } // Create a token representing an indent. It's not part of the AST and it will
    // be trimmed and merged into adjacent TextElements, or turned into a new
    // TextElement, if it's surrounded by two Placeables.


    getIndent(ps, value, start) {
      return new Indent(value, start, ps.index);
    } // Dedent a list of elements by removing the maximum common indent from the
    // beginning of text lines. The common indent is calculated in getPattern.


    dedent(elements, commonIndent) {
      const trimmed = [];

      for (let element of elements) {
        if (element instanceof Placeable) {
          trimmed.push(element);
          continue;
        }

        if (element instanceof Indent) {
          // Strip common indent.
          element.value = element.value.slice(0, element.value.length - commonIndent);

          if (element.value.length === 0) {
            continue;
          }
        }

        let prev = trimmed[trimmed.length - 1];

        if (prev && prev instanceof TextElement) {
          // Join adjacent TextElements by replacing them with their sum.
          const sum = new TextElement(prev.value + element.value);

          if (this.withSpans) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            sum.addSpan(prev.span.start, element.span.end);
          }

          trimmed[trimmed.length - 1] = sum;
          continue;
        }

        if (element instanceof Indent) {
          // If the indent hasn't been merged into a preceding TextElement,
          // convert it into a new TextElement.
          const textElement = new TextElement(element.value);

          if (this.withSpans) {
            textElement.addSpan(element.span.start, element.span.end);
          }

          element = textElement;
        }

        trimmed.push(element);
      } // Trim trailing whitespace from the Pattern.


      const lastElement = trimmed[trimmed.length - 1];

      if (lastElement instanceof TextElement) {
        lastElement.value = lastElement.value.replace(trailingWSRe, "");

        if (lastElement.value.length === 0) {
          trimmed.pop();
        }
      }

      return trimmed;
    }

    getTextElement(ps) {
      let buffer = "";
      let ch;

      while (ch = ps.currentChar()) {
        if (ch === "{" || ch === "}") {
          return new TextElement(buffer);
        }

        if (ch === EOL) {
          return new TextElement(buffer);
        }

        buffer += ch;
        ps.next();
      }

      return new TextElement(buffer);
    }

    getEscapeSequence(ps) {
      const next = ps.currentChar();

      switch (next) {
        case "\\":
        case "\"":
          ps.next();
          return `\\${next}`;

        case "u":
          return this.getUnicodeEscapeSequence(ps, next, 4);

        case "U":
          return this.getUnicodeEscapeSequence(ps, next, 6);

        default:
          throw new ParseError("E0025", next);
      }
    }

    getUnicodeEscapeSequence(ps, u, digits) {
      ps.expectChar(u);
      let sequence = "";

      for (let i = 0; i < digits; i++) {
        const ch = ps.takeHexDigit();

        if (!ch) {
          throw new ParseError("E0026", `\\${u}${sequence}${ps.currentChar()}`);
        }

        sequence += ch;
      }

      return `\\${u}${sequence}`;
    }

    getPlaceable(ps) {
      ps.expectChar("{");
      ps.skipBlank();
      const expression = this.getExpression(ps);
      ps.expectChar("}");
      return new Placeable(expression);
    }

    getExpression(ps) {
      const selector = this.getInlineExpression(ps);
      ps.skipBlank();

      if (ps.currentChar() === "-") {
        if (ps.peek() !== ">") {
          ps.resetPeek();
          return selector;
        } // Validate selector expression according to
        // abstract.js in the Fluent specification


        if (selector instanceof MessageReference) {
          if (selector.attribute === null) {
            throw new ParseError("E0016");
          } else {
            throw new ParseError("E0018");
          }
        } else if (selector instanceof TermReference) {
          if (selector.attribute === null) {
            throw new ParseError("E0017");
          }
        } else if (selector instanceof Placeable) {
          throw new ParseError("E0029");
        }

        ps.next();
        ps.next();
        ps.skipBlankInline();
        ps.expectLineEnd();
        const variants = this.getVariants(ps);
        return new SelectExpression(selector, variants);
      }

      if (selector instanceof TermReference && selector.attribute !== null) {
        throw new ParseError("E0019");
      }

      return selector;
    }

    getInlineExpression(ps) {
      if (ps.currentChar() === "{") {
        return this.getPlaceable(ps);
      }

      if (ps.isNumberStart()) {
        return this.getNumber(ps);
      }

      if (ps.currentChar() === '"') {
        return this.getString(ps);
      }

      if (ps.currentChar() === "$") {
        ps.next();
        const id = this.getIdentifier(ps);
        return new VariableReference(id);
      }

      if (ps.currentChar() === "-") {
        ps.next();
        const id = this.getIdentifier(ps);
        let attr;

        if (ps.currentChar() === ".") {
          ps.next();
          attr = this.getIdentifier(ps);
        }

        let args;
        ps.peekBlank();

        if (ps.currentPeek() === "(") {
          ps.skipToPeek();
          args = this.getCallArguments(ps);
        }

        return new TermReference(id, attr, args);
      }

      if (ps.isIdentifierStart()) {
        const id = this.getIdentifier(ps);
        ps.peekBlank();

        if (ps.currentPeek() === "(") {
          // It's a Function. Ensure it's all upper-case.
          if (!/^[A-Z][A-Z0-9_-]*$/.test(id.name)) {
            throw new ParseError("E0008");
          }

          ps.skipToPeek();
          let args = this.getCallArguments(ps);
          return new FunctionReference(id, args);
        }

        let attr;

        if (ps.currentChar() === ".") {
          ps.next();
          attr = this.getIdentifier(ps);
        }

        return new MessageReference(id, attr);
      }

      throw new ParseError("E0028");
    }

    getCallArgument(ps) {
      const exp = this.getInlineExpression(ps);
      ps.skipBlank();

      if (ps.currentChar() !== ":") {
        return exp;
      }

      if (exp instanceof MessageReference && exp.attribute === null) {
        ps.next();
        ps.skipBlank();
        const value = this.getLiteral(ps);
        return new NamedArgument(exp.id, value);
      }

      throw new ParseError("E0009");
    }

    getCallArguments(ps) {
      const positional = [];
      const named = [];
      const argumentNames = new Set();
      ps.expectChar("(");
      ps.skipBlank();

      while (true) {
        if (ps.currentChar() === ")") {
          break;
        }

        const arg = this.getCallArgument(ps);

        if (arg instanceof NamedArgument) {
          if (argumentNames.has(arg.name.name)) {
            throw new ParseError("E0022");
          }

          named.push(arg);
          argumentNames.add(arg.name.name);
        } else if (argumentNames.size > 0) {
          throw new ParseError("E0021");
        } else {
          positional.push(arg);
        }

        ps.skipBlank();

        if (ps.currentChar() === ",") {
          ps.next();
          ps.skipBlank();
          continue;
        }

        break;
      }

      ps.expectChar(")");
      return new CallArguments(positional, named);
    }

    getString(ps) {
      ps.expectChar("\"");
      let value = "";
      let ch;

      while (ch = ps.takeChar(x => x !== '"' && x !== EOL)) {
        if (ch === "\\") {
          value += this.getEscapeSequence(ps);
        } else {
          value += ch;
        }
      }

      if (ps.currentChar() === EOL) {
        throw new ParseError("E0020");
      }

      ps.expectChar("\"");
      return new StringLiteral(value);
    }

    getLiteral(ps) {
      if (ps.isNumberStart()) {
        return this.getNumber(ps);
      }

      if (ps.currentChar() === '"') {
        return this.getString(ps);
      }

      throw new ParseError("E0014");
    }

  }

  class Indent {
    constructor(value, start, end) {
      this.type = "Indent";
      this.value = value;
      this.span = new Span(start, end);
    }

  }

  function parse(source, opts) {
    const parser = new FluentParser(opts);
    return parser.parse(source);
  }

  const getTypeName = item => 'get' + item.type;

  var serializer = {
    serialize(item) {
      if (this[getTypeName(item)]) {
        return this[getTypeName(item)](item);
      } else {
        console.warn('unknown type:', item.type, item);
      }
    },

    getComment(item) {
      return {
        key: 'comment',
        value: item.content
      };
    },

    getGroupComment() {
      return null;
    },

    getResourceComment() {
      return null;
    },

    getMessage(item) {
      return {
        key: this[getTypeName(item.id)](item.id),
        value: this[getTypeName(item.value)](item.value),
        comment: item.comment && this[getTypeName(item.comment)](item.comment),
        attributes: item.attributes && item.attributes.map(attr => {
          return this.serialize(attr);
        })
      };
    },

    getAttribute(item) {
      return {
        key: this[getTypeName(item.id)](item.id),
        value: this[getTypeName(item.value)](item.value)
      };
    },

    getTerm(item) {
      return {
        key: `-${this[getTypeName(item.id)](item.id)}`,
        value: this[getTypeName(item.value)](item.value),
        comment: item.comment && this[getTypeName(item.comment)](item.comment),
        attributes: item.attributes && item.attributes.map(attr => {
          return this.serialize(attr);
        })
      };
    },

    getIdentifier(item) {
      return item.name;
    },

    getStringLiteral(item) {
      return item.value;
    },

    getPattern(item) {
      const items = item.elements.map(placeable => {
        if (placeable.expression) {
          if (!this[getTypeName(placeable.expression)]) {
            return console.log('unknown1', getTypeName(placeable.expression), placeable.expression);
          }

          return this[getTypeName(placeable.expression)](placeable.expression);
        } else {
          if (!this[getTypeName(placeable)]) {
            return console.log('unknown2', getTypeName(placeable), placeable);
          }

          return this[getTypeName(placeable)](placeable);
        }
      });
      return items.join('');
    },

    getCallExpression(item) {
      const fcName = item.callee.name;
      const positionals = item.positional.map(positional => {
        return this[getTypeName(positional)](positional, true);
      });
      const nameds = item.named.map(named => {
        return this[getTypeName(named)](named);
      });
      return '{ ' + fcName + '($' + positionals.join(' ') + (nameds.length ? ', ' + nameds.join(', ') : '') + ') }';
    },

    getNamedArgument(item) {
      return this[getTypeName(item.name)](item.name) + ': "' + this[getTypeName(item.value)](item.value) + '"';
    },

    getTextElement(item) {
      return item.value;
    },

    getSelectExpression(item) {
      const id = this[getTypeName(item.selector)](item.selector, true);
      const variants = item.variants.map(variant => {
        return this[getTypeName(variant)](variant);
      });
      return '{ $' + id + ' ->\n' + variants.join('\n') + '\n}';
    },

    getVariantExpression(item) {
      const ref = this[getTypeName(item.ref)](item.ref, true);
      const key = this[getTypeName(item.key)](item.key);
      if (key) return '{ ' + ref + '[' + key + '] }';
      return ' { ' + ref + ' } ';
    },

    getVariableReference(item, plain) {
      if (plain) return this[getTypeName(item.id)](item.id);
      return '{ $' + this[getTypeName(item.id)](item.id) + ' }';
    },

    getTermReferences(item, plain) {
      if (plain) return this[getTypeName(item.id)](item.id);
      return '{ ' + this[getTypeName(item.id)](item.id) + ' }';
    },

    getVariantName(item) {
      return item.name;
    },

    getVariantList(item) {
      const variants = item.variants.map(variant => {
        return this[getTypeName(variant)](variant);
      });
      return '{\n' + variants.join('\n') + '\n}';
    },

    getVariant(item) {
      const name = item.key.name ? item.key.name : item.key.value;
      const isDefault = item.default;
      const pattern = this[getTypeName(item.value)](item.value);
      const ret = '[' + name + '] ' + pattern;
      if (isDefault) return ' *' + ret;
      return '  ' + ret;
    },

    getFunctionReference(item) {
      let args = '';
      item.arguments.positional.forEach((p, i) => {
        if (i > 0) args += ', ';
        args += `$${p.id.name}`;
      });
      item.arguments.named.forEach((n, i) => {
        if (i > 0 || args !== '') args += ', ';
        args += `${n.name.name}: "${n.value.value}"`;
      });
      return `{ ${item.id.name}(${args}) }`;
    },

    getTermReference(item) {
      return `{ -${item.id.name} }`;
    },

    getJunk(item) {
      const parts = item.content.split('=');
      const key = parts.shift().trim();
      const value = parts.join('=').trim().replace(/\n {3}/g, '\n ').replace(/\n {2}}/g, '\n}');
      return {
        key,
        value
      };
    }

  };

  function ftlToJs(str, cb, params = {
    respectComments: true
  }) {
    if (typeof str !== 'string') {
      if (!cb) throw new Error('The first parameter was not a string');
      return cb(new Error('The first parameter was not a string'));
    }

    const parsed = parse(str, {
      withSpans: false
    });
    const result = parsed.body.reduce((mem, segment) => {
      const item = serializer.serialize(segment);
      if (!item) return mem;

      if (item.attributes && item.attributes.length || item.comment && params.respectComments) {
        const inner = {};
        if (item.comment) inner[item.comment.key] = item.comment.value;

        if (item.attributes && item.attributes.length) {
          item.attributes.forEach(attr => {
            inner[attr.key] = attr.value;
          });
        }

        inner.val = item.value;
        mem[item.key] = inner;
      } else {
        mem[item.key] = item.value;
      }

      return mem;
    }, {});
    if (cb) cb(null, result);
    return result;
  }

  function getDefaults() {
    return {
      loadPath: '/locales/{{lng}}/{{ns}}.ftl',
      addPath: '/locales/add/{{lng}}/{{ns}}',
      parse: function (data, url) {
        return ftlToJs(data);
      },
      crossDomain: false,
      ajax: ajax
    };
  }

  class Backend {
    constructor(services, options = {}) {
      this.init(services, options);
      this.type = 'backend';
    }

    init(services, options = {}) {
      this.services = services;
      this.options = defaults(options, this.options || {}, getDefaults());
    }

    read(language, namespace, callback) {
      var loadPath = this.options.loadPath;

      if (typeof this.options.loadPath === 'function') {
        loadPath = this.options.loadPath([language], [namespace]);
      }

      let url = this.services.interpolator.interpolate(loadPath, {
        lng: language,
        ns: namespace
      });
      this.loadUrl(url, callback);
    }

    loadUrl(url, callback) {
      this.options.ajax(url, this.options, (data, xhr) => {
        if (xhr.status >= 500 && xhr.status < 600) return callback('failed loading ' + url, true
        /* retry */
        );
        if (xhr.status >= 400 && xhr.status < 500) return callback('failed loading ' + url, false
        /* no retry */
        );
        let ret, err;

        try {
          ret = this.options.parse(data, url);
        } catch (e) {
          err = 'failed parsing ' + url + ' to json';
        }

        if (err) return callback(err, false);
        callback(null, ret);
      });
    }

    create(languages, namespace, key, fallbackValue) {
      if (typeof languages === 'string') languages = [languages];
      let payload = {};
      payload[key] = fallbackValue || '';
      languages.forEach(lng => {
        let url = this.services.interpolator.interpolate(this.options.addPath, {
          lng: lng,
          ns: namespace
        });
        this.options.ajax(url, this.options, function (data, xhr) {//const statusCode = xhr.status.toString();
          // TODO: if statusCode === 4xx do log
        }, payload);
      });
    }

  }

  Backend.type = 'backend';

  return Backend;

})));
