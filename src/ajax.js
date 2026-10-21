function addQueryString(url, params) {
  if (!params || typeof params !== 'object') return url;

  // Must encode data
  const queryString = Object.keys(params)
    .map((name) => `${encodeURIComponent(name)}=${encodeURIComponent(params[name])}`)
    .join('&');
  if (!queryString) return url;

  return url + (url.indexOf('?') !== -1 ? '&' : '?') + queryString;
}

// https://gist.github.com/Xeoncross/7663273
function ajax(url, options, callback, data, cache) {
  if (data && typeof data === 'object') {
    // eslint-disable-next-line no-underscore-dangle
    if (!cache) data._t = new Date();
    // URL encoded form data must be in querystring format
    data = addQueryString('', data).slice(1);
  }

  if (options.queryStringParams) {
    url = addQueryString(url, options.queryStringParams);
  }

  try {
    const x = new XMLHttpRequest();
    x.open(data ? 'POST' : 'GET', url, 1);
    if (!options.crossDomain) {
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
    x.withCredentials = !!options.withCredentials;
    if (data) {
      x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    if (x.overrideMimeType) {
      x.overrideMimeType('application/json');
    }
    const h = options.customHeaders;
    if (h) {
      Object.keys(h).forEach((name) => x.setRequestHeader(name, h[name]));
    }
    x.onreadystatechange = () => {
      if (x.readyState > 3 && callback) callback(x.responseText, x);
    };
    x.send(data);
  } catch (e) {
    console.log(e); // eslint-disable-line no-console
  }
}

export default ajax;
