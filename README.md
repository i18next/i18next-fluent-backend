# Introduction

[![npm version](https://img.shields.io/npm/v/i18next-fluent-backend.svg?style=flat-square)](https://www.npmjs.com/package/i18next-fluent-backend)
[![David](https://img.shields.io/david/i18next/i18next-fluent-backend.svg?style=flat-square)](https://david-dm.org/i18next/i18next-fluent-backend)

This is a simple i18next backend to be used in the browser. It will load resource in fluent format (.ftl) from a backend server using xhr.

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/i18next-fluent-backend), bower or [downloaded](https://github.com/i18next/i18next-xhr-backend/blob/master/i18nextFluentBackend.min.js) from this repo.

```
# npm package
$ npm install i18next-fluent-backend
```

Wiring up:

```js
import i18next from "i18next";
import FluentBackend from "i18next-fluent-backend";

i18next.use(FluentBackend).init(i18nextOptions);
```

- As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.
- If you don't use a module loader it will be added to `window.i18nextFluentBackend`

## Backend Options

```js
{
  // path where resources get loaded from, or a function
  // returning a path:
  // function(lngs, namespaces) { return customPath; }
  // the returned path will interpolate lng, ns if provided like giving a static path
  loadPath: '/locales/{{lng}}/{{ns}}.ftl',

  // path to post missing resources
  addPath: 'locales/add/{{lng}}/{{ns}}',

  // override fluent parser
  parse: function(data) { return data.replace(/a/g, ''); },

  // allow cross domain requests
  crossDomain: false,

  // allow credentials on cross domain requests
  withCredentials: false,

  // define a custom xhr function
  // can be used to support XDomainRequest in IE 8 and 9
  ajax: function (url, options, callback, data) {},

  // adds parameters to resource URL. 'example.com' -> 'example.com?v=1.3.5'
  queryStringParams: { v: '1.3.5' }
}
```

Options can be passed in:

**preferred** - by setting options.backend in i18next.init:

```js
import i18next from "i18next";
import FluentBackend from "i18next-fluent-backend";

i18next.use(FluentBackend).init({
  backend: options
});
```

on construction:

```js
import FluentBackend from "i18next-fluent-backend";
const fltBackend = new FluentBackend(null, options);
```

via calling init:

```js
import FluentBackend from "i18next-fluent-backend";
const fltBackend = new FluentBackend();
fltBackend.init(options);
```

---

<h3 align="center">Gold Sponsors</h3>

<p align="center">
  <a href="https://locize.com/" target="_blank">
    <img src="https://raw.githubusercontent.com/i18next/i18next/master/assets/locize_sponsor_240.gif" width="240px">
  </a>
</p>
