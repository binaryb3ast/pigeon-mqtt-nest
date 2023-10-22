import { SystemTopics } from 'enum/pigeon.topic.enum';

const SEGMENT_PATTERN_REGEXP = /^((\w+\/)*):?\w+((\/:\w+)+)?$/g;

/**
 * Checks if a value is a regular expression.
 * @param value - The value to be checked.
 * @returns `true` if the value is a regular expression, `false` otherwise.
 */
export function isRegExp(value: any): boolean {
  return (
    value instanceof RegExp ||
    (typeof value === 'object' &&
      Object.prototype.toString.call(value) === '[object RegExp]')
  );
}

/**
 * Checks if a URL follows a specific segment pattern.
 * @param url - The URL to be checked.
 * @returns `true` if the URL matches the segment pattern, `false` otherwise.
 */
export function isSegmentUrl(url: any): boolean {
  return isString(url) && SEGMENT_PATTERN_REGEXP.test(url);
}

/**
 * Checks if a topic is a system topic (starts with "$PIGEON").
 * @param topic - The topic to be checked.
 * @returns `true` if the topic is a system topic, `false` otherwise.
 */
export function isSystemTopic(topic: string): boolean {
  return topic.startsWith('$PIGEON');
}

/**
 * Checks if a topic is a system topic represented as a regular expression.
 * @param topic - The topic to be checked.
 * @returns `true` if the topic is a system topic represented as a regular expression, `false` otherwise.
 */
export function isSystemTopicRegExp(topic: string): boolean {
  return SystemTopics.HEART_BEAT.toString() == topic.toString();
}

/**
 * Checks if a value is a string.
 * @param value - The value to be checked.
 * @returns `true` if the value is a string, `false` otherwise.
 */
export function isString(value: any) {
  return typeof value === 'string';
}

/**
 * Checks if every element in an array is a string.
 * @param arr - The array to be checked.
 * @returns `true` if every element in the array is a string, `false` otherwise.
 */
export function isEveryElementString(arr: any): boolean {
  return Array.isArray(arr) && arr.every((elem) => typeof elem === 'string');
}

/**
 * Checks if every element in an array is a regular expression.
 * @param arr - The array to be checked.
 * @returns `true` if every element in the array is a regular expression, `false` otherwise.
 */
export function isEveryElementRegExp(arr: any): boolean {
  return (
    Array.isArray(arr) &&
    arr.every((elem) => {
      try {
        new RegExp(elem);
        return true;
      } catch {
        return false;
      }
    })
  );
}
