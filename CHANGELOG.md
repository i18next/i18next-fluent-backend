### 1.1.1

- fix: i18next 26.7.0 deprecates guessing the calling convention of a backend from the number of parameters of its methods; the backend now declares it with `callbackApi`, so i18next calls `read` and `create` with a callback (and passes `create` its options), and debug mode no longer logs the deprecation notice. Older i18next versions ignore it.

### 1.1.0

- fix: the CommonJS build (`require('i18next-fluent-backend')`) required fluent_conv's ES module file, which Node.js only loads through `require` since 20.19 and 22.12. It now imports `fluent_conv/ftl2js`, which resolves to fluent_conv's CommonJS build for `require`.
- fix: `addPath` is interpolated like `loadPath` with the backend's own function (1.0.1 said so, but `create` still used i18next's interpolator). Values are no longer HTML-escaped (`a/b` was sent as `a&#x2F;b`), and `create` works without i18next services.
- the default ajax function no longer falls back to `ActiveXObject` (IE 6); a custom `ajax` option still works as before
- fluent_conv `^3.3.1`: a .ftl file with a message that has attributes and no value (`login-input =` followed by `.placeholder = ...`) loads, before the whole namespace failed with `failed parsing ... to json`; `{ login-input.placeholder }` keeps its attribute and `NUMBER($n, minimumFractionDigits: 2)` its number
- tests (there were none) for read, create, the default ajax function and i18next 26 with vitest; rollup 4, eslint airbnb-base, CI on Node.js 20, 22 and 24
- README: use with i18next-fluent, `customHeaders`, the `addPath` default, the download link and the `init(null, options)` example

### 1.0.1

- use own interpolation function for loadPath and addPath instead of relying on i18next's interpolator

### 1.0.0

- merge invalid import for fluent_conv [4](https://github.com/i18next/i18next-fluent-backend/pull/4)

### 0.0.3

- update dependencies

### 0.0.2

- fix the parse function

### 0.0.1

- initial version
