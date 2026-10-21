export function defaults(obj, ...sources) {
  sources.forEach((source) => {
    if (!source) return;
    Object.keys(source).forEach((prop) => {
      if (obj[prop] === undefined) obj[prop] = source[prop];
    });
  });
  return obj;
}

const interpolationRegexp = /\{\{(.+?)\}\}/g;
export function interpolate(str, data) {
  return str.replace(interpolationRegexp, (match, key) => {
    const value = data[key.trim()];
    return value != null ? value : match;
  });
}
