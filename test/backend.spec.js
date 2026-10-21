import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import BackendSrc from '../src';
import BackendDist from '../i18nextFluentBackend.js';
import BackendMin from '../i18nextFluentBackend.min.js';

const ftl = `# a comment
hello = Hello { $name }.
emails = { $unreadEmails ->
    [one] You have one unread email.
   *[other] You have { $unreadEmails } unread emails.
 }
-brand = Firefox
about = About { -brand }
login = Login
    .placeholder = email@example.com
`;

// answers like the browser's XMLHttpRequest would, and remembers the calls
function fakeAjax(files) {
  const calls = [];
  const fn = (url, options, callback, data) => {
    calls.push({ url, data });
    if (data) return callback('', { status: 200 });
    if (!(url in files)) return callback('', { status: 404 });
    if (files[url] instanceof Error) return callback('', { status: 503 });
    return callback(files[url], { status: 200 });
  };
  fn.calls = calls;
  return fn;
}

for (const [name, Backend] of Object.entries(
  process.env.CI ? { src: BackendSrc, dist: BackendDist, min: BackendMin } : { src: BackendSrc }
)) {
  describe(`fluent backend ${name}`, () => {
    describe('read', () => {
      it('loads and parses a .ftl file from the interpolated loadPath', () => new Promise((done) => {
        const ajax = fakeAjax({ '/locales/en/translation.ftl': ftl });
        const backend = new Backend(null, { ajax });
        backend.read('en', 'translation', (err, data) => {
          expect(err).toBe(null);
          expect(data).toEqual({
            hello: { comment: 'a comment', val: 'Hello { $name }.' },
            emails: '{ $unreadEmails ->\n  [one] You have one unread email.\n *[other] You have { $unreadEmails } unread emails.\n}',
            '-brand': 'Firefox',
            about: 'About { -brand }',
            login: { val: 'Login', placeholder: 'email@example.com' }
          });
          done();
        });
      }));

      it('calls a loadPath function with arrays of language and namespace', () => new Promise((done) => {
        const loadPath = vi.fn(() => '/ftl/{{ns}}-{{lng}}.ftl');
        const backend = new Backend(null, { loadPath, ajax: fakeAjax({ '/ftl/common-de.ftl': 'hi = Hallo' }) });
        backend.read('de', 'common', (err, data) => {
          expect(loadPath).toHaveBeenCalledWith(['de'], ['common']);
          expect(data).toEqual({ hi: 'Hallo' });
          done();
        });
      }));

      it('reports 4xx without retry, 5xx with retry', () => new Promise((done) => {
        const backend = new Backend(null, { ajax: fakeAjax({ '/locales/fr/translation.ftl': new Error() }) });
        backend.read('it', 'translation', (err, retry) => {
          expect(err).toBe('failed loading /locales/it/translation.ftl');
          expect(retry).toBe(false);
          backend.read('fr', 'translation', (err2, retry2) => {
            expect(err2).toBe('failed loading /locales/fr/translation.ftl');
            expect(retry2).toBe(true);
            done();
          });
        });
      }));

      it('reports a parse error', () => new Promise((done) => {
        const parse = () => { throw new Error('broken'); };
        const backend = new Backend(null, { parse, ajax: fakeAjax({ '/locales/en/translation.ftl': ftl }) });
        backend.read('en', 'translation', (err, retry) => {
          expect(err).toBe('failed parsing /locales/en/translation.ftl to json');
          expect(retry).toBe(false);
          done();
        });
      }));
    });

    describe('create', () => {
      it('posts the missing key to the interpolated addPath of each language, without i18next services', () => {
        const ajax = fakeAjax({});
        const backend = new Backend(null, { ajax, addPath: '/add/{{lng}}/{{ns}}' });
        backend.create(['en', 'de'], 'common', 'newKey', 'New key');
        backend.create('fr', 'common', 'other');
        expect(ajax.calls).toEqual([
          { url: '/add/en/common', data: { newKey: 'New key' } },
          { url: '/add/de/common', data: { newKey: 'New key' } },
          { url: '/add/fr/common', data: { other: '' } }
        ]);
      });
    });

    describe('default ajax', () => {
      let requests;

      beforeAll(() => {
        requests = [];
        vi.stubGlobal('XMLHttpRequest', class {
          constructor() {
            this.headers = {};
            requests.push(this);
          }

          open(method, url) { Object.assign(this, { method, url }); }

          setRequestHeader(header, value) { this.headers[header] = value; }

          overrideMimeType() {}

          send(body) {
            this.body = body;
            Object.assign(this, { readyState: 4, status: 200, responseText: 'hello = Hello' });
            this.onreadystatechange();
          }
        });
      });

      afterEach(() => {
        requests.length = 0;
      });

      it('loads with GET, query string params and custom headers', () => new Promise((done) => {
        const backend = new Backend(null, { queryStringParams: { v: '1.3.5' }, customHeaders: { authorization: 'x' } });
        backend.read('en', 'translation', (err, data) => {
          expect(data).toEqual({ hello: 'Hello' });
          expect(requests[0].method).toBe('GET');
          expect(requests[0].url).toBe('/locales/en/translation.ftl?v=1.3.5');
          expect(requests[0].headers).toEqual({ 'X-Requested-With': 'XMLHttpRequest', authorization: 'x' });
          done();
        });
      }));

      it('posts form encoded data', () => {
        const backend = new Backend(null, { crossDomain: true });
        backend.create('en', 'translation', 'a key', 'a & b');
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe('/locales/add/en/translation');
        expect(requests[0].headers).toEqual({ 'Content-type': 'application/x-www-form-urlencoded' });
        expect(requests[0].body).toMatch(/^a%20key=a%20%26%20b&_t=/);
      });
    });

    describe('with i18next', () => {
      let i18n;
      let ajax;

      beforeAll(async () => {
        ajax = fakeAjax({ '/locales/en/translation.ftl': ftl });
        i18n = i18next.createInstance();
        await i18n.use(Backend).init({
          lng: 'en',
          fallbackLng: false,
          saveMissing: true,
          backend: { ajax }
        });
      });

      it('loads the namespace into the store', () => {
        expect(i18n.t('about')).toBe('About { -brand }');
        expect(i18n.t('login.placeholder')).toBe('email@example.com');
      });

      it('saves missing keys through create', () => {
        i18n.t('missing', { defaultValue: 'Missing' });
        expect(ajax.calls.at(-1)).toEqual({ url: '/locales/add/en/translation', data: { missing: 'Missing' } });
      });
    });
  });
}
