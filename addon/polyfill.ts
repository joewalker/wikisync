
/**
 * objectAssign = Object.assign
 * This is taken from MDN with some error handling removed and types added
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
export function objectAssign(target: Object, args: Object): Object {
  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];
    if (nextSource != null) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          target[nextKey] = nextSource[nextKey];
        }
      }
    }
  }

  return target;
}

/**
 * stringRepeat = String.repeat
 * This is taken from MDN with some error handling removed and types added
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
 */
export function stringRepeat(str: string, count: number) {
  if (count < 0) {
    throw new RangeError('repeat count must be non-negative');
  }
  if (count == Infinity) {
    throw new RangeError('repeat count must be less than infinity');
  }
  count = Math.floor(count);
  if (str.length == 0 || count == 0) {
    return '';
  }
  // Ensuring count is a 31-bit integer allows us to heavily optimize the
  // main part. But anyway, most current (August 2014) browsers can't handle
  // strings 1 << 28 chars or longer, so:
  if (str.length * count >= 1 << 28) {
    throw new RangeError('repeat count must not overflow maximum string size');
  }
  var maxCount = str.length * count;
  count = Math.floor(Math.log(count) / Math.log(2));
  while (count) {
     str += str;
     count--;
  }
  str += str.substring(0, maxCount - str.length);
  return str;
}

/**
 * You should be able to [ ... '' ] however GAppsScript...
 */
export function toStringArray(str: string): string[] {
  const reply: string[] = [];
  for (let i = 0; i < str.length; i++) {
    reply.push(str.charAt(i));
  }
  return reply;
}
