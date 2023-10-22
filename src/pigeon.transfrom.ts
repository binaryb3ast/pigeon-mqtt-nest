import { MqttMessageTransformer } from 'pigeon.interface';
type JSONValue = string | number | boolean | JSONObject | JSONArray;
type JSONArray = Array<JSONValue>;

/**
 * An interface representing a JSON object, where keys are strings and values can be of various types.
 */
interface JSONObject {
  [x: string]: JSONValue;
}

/**
 * JSON message transformer function.
 * @param payload - The message payload as a string or buffer.
 * @returns Parsed JSON object from the payload.
 */
export const JsonTransform: MqttMessageTransformer<JSONObject> = (
  payload?: string | Buffer,
) => {
  return JSON.parse(payload.toString('utf-8'));
};

/**
 * Get the appropriate message transformer based on the provided value.
 * @returns The appropriate message transformer function.
 * @param payload
 */
export const TextTransform: MqttMessageTransformer<string> = (
  payload?: string | Buffer,
) => {
  return payload.toString('utf-8');
};

/**
 * Get the appropriate message transformer based on the provided value.
 * @param transform - The transformation type ('json', 'text', or a custom transformer function).
 * @returns The appropriate message transformer function.
 */
export function getTransform(
  transform?: 'json' | 'text' | MqttMessageTransformer<unknown>,
) {
  if (typeof transform === 'function') {
    // If a transformer function is provided, return it
    return transform;
  } else {
    // Otherwise, return the appropriate pre-defined transformer based on the value of 'transform'
    if (transform === 'json') {
      return JsonTransform;
    } else {
      return TextTransform;
    }
  }
}
