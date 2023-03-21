import { MqttMessageTransformer } from "pigeon.interface";
type JSONValue = string | number | boolean | JSONObject | JSONArray;
type JSONArray = Array<JSONValue>;

// Define an interface for JSON objects
interface JSONObject {
  [x: string]: JSONValue;
}

// Define a message transformer that converts JSON string to object
export const JsonTransform: MqttMessageTransformer<JSONObject> = (payload?: string | Buffer) => {
  return JSON.parse(payload.toString('utf-8'));
};

// Define a message transformer that returns the payload as string
export const TextTransform: MqttMessageTransformer<string> = (payload?: string | Buffer) => {
  return payload.toString('utf-8');
};

// Get the appropriate message transformer based on the provided value
export function getTransform(transform?: 'json' | 'text' | MqttMessageTransformer<unknown>) {
  if (typeof transform === 'function') { // If a transformer function is provided, return it
    return transform;
  } else { // Otherwise, return the appropriate pre-defined transformer based on the value of 'transform'
    if (transform === 'json') {
      return JsonTransform;
    } else {
      return TextTransform;
    }
  }
}