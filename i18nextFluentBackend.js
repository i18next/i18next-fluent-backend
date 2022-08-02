(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fluent_conv/ftl2js')) :
  typeof define === 'function' && define.amd ? define(['fluent_conv/ftl2js'], factory) :
  (global.i18nextFluentBackend = factory(global.ftl2js));
}(this, (function (ftl2js) { 'use strict';

  ftl2js = ftl2js && ftl2js.hasOwnProperty('default') ? ftl2js['default'] : ftl2js;

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

  function getDefaults() {
    return {
      loadPath: '/locales/{{lng}}/{{ns}}.ftl',
      addPath: '/locales/add/{{lng}}/{{ns}}',
      parse: function (data, url) {
        return ftl2js(data);
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
