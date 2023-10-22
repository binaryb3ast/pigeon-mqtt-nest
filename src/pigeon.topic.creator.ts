import { EventType } from 'enum/pigeon.eventtype.enum';
import {
  isEveryElementRegExp,
  isEveryElementString,
  isRegExp,
  isSegmentUrl,
  isString,
  isSystemTopic,
  isSystemTopicRegExp,
} from 'pigeon.validator';

function generatePatternRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/:[^/]+/g, '([^/]+)')
    .replace(/\//g, '\\/');
  return new RegExp(`^${regexPattern}$`);
}

export function getTopicType(topic: any): EventType {
  if (isString(topic)) {
    if (isSystemTopic(topic)) {
      return EventType.SYSTEM_TOPIC;
    }
    return isSegmentUrl(topic) ? EventType.SEGMENT : EventType.STRING;
  } else if (isRegExp(topic)) {
    if (isSystemTopicRegExp(topic)) {
      return EventType.SYSTEM_TOPIC;
    }
    return EventType.REGEXP;
  } else if (Array.isArray(topic)) {
    return isEveryElementString(topic)
      ? EventType.ARR_STRING
      : isEveryElementRegExp(topic)
      ? EventType.ARR_REGEXP
      : EventType.UNKNOWN;
  } else {
    return EventType.UNKNOWN;
  }
}

export function extractSegments(url: string, pattern: string): object {
  const patternRegex = generatePatternRegex(pattern);
  const match = patternRegex.exec(url);
  if (!match) return null;
  const keys = pattern.match(/:[^/]+/g).map((key) => key.slice(1));
  return keys.reduce((obj, key, i) => ({ ...obj, [key]: match[i + 1] }), {});
}
