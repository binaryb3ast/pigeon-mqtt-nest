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

/**
 * Generates a regular expression from a pattern string, replacing path segments with regex capture groups.
 * @param pattern - The pattern string to convert to a regular expression.
 * @returns A regular expression pattern matching the provided string pattern.
 */
function generatePatternRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/:[^/]+/g, '([^/]+)')
    .replace(/\//g, '\\/');
  return new RegExp(`^${regexPattern}$`);
}

/**
 * Determines the type of the provided MQTT topic.
 * @param topic - The MQTT topic to evaluate.
 * @returns The type of the MQTT topic (e.g., SEGMENT, STRING, REGEXP, etc.).
 */
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

/**
 * Extracts URL segments from a URL based on a provided pattern.
 * @param url - The URL string to extract segments from.
 * @param pattern - The pattern used to extract segments from the URL.
 * @returns An object containing extracted segments and their values.
 */
export function extractSegments(url: string, pattern: string): object {
  const patternRegex = generatePatternRegex(pattern);
  const match = patternRegex.exec(url);
  if (!match) return null;
  const keys = pattern.match(/:[^/]+/g).map((key) => key.slice(1));
  return keys.reduce((obj, key, i) => ({ ...obj, [key]: match[i + 1] }), {});
}
