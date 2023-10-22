import { SystemTopics } from 'enum/pigeon.topic.enum';

const SEGMENT_PATTERN_REGEXP = /^((\w+\/)*):?\w+((\/:\w+)+)?$/g;

export function isRegExp(value: any): boolean {
  return (
    value instanceof RegExp ||
    (typeof value === 'object' &&
      Object.prototype.toString.call(value) === '[object RegExp]')
  );
}

export function isSegmentUrl(url: any): boolean {
  return isString(url) && SEGMENT_PATTERN_REGEXP.test(url);
}

export function isSystemTopic(topic: string): boolean {
  return topic.startsWith('$PIGEON');
}

export function isSystemTopicRegExp(topic: string): boolean {
  return SystemTopics.HEART_BEAT.toString() == topic.toString();
}

export function isString(value: any) {
  return typeof value === 'string';
}

export function isEveryElementString(arr: any): boolean {
  return Array.isArray(arr) && arr.every((elem) => typeof elem === 'string');
}

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
