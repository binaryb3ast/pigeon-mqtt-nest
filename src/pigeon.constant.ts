export const KEY_SUBSCRIBE_OPTIONS = "__pigeon_subscribe_options";
export const KEY_SUBSCRIBER_PARAMS = "__pigeon_subscriber_params";

export const LOGGER_KEY =  "Pigeon MQTT"
export const INSTANCE_BROKER = "INSTANCE_BROKER";
export const PIGEON_OPTION_PROVIDER = "PIGEON_OPTION_PROVIDER";
export const PIGEON_LOGGER_PROVIDER = "PIGEON_LOGGER_PROVIDER";

export const SystemTopicRegexEnum = {
  CLIENT_NEW: /^\$?SYS\/([^/\n]*)\/new\/clients/,
  CLIENT_READY: /^\$?AEDES\/ready\/clients/,
  CLIENT_DISCONNECT: /^\$?SYS\/([^/\n]*)\/disconnect\/clients/,
  PUBLISH: /^\$?AEDES\/new\/publish/,
  PING: /^\$?AEDES\/ping/,
  HEART_BEAT: /^\$?SYS\/([^/\n]*)\/heartbeat/,
  SUBSCRIBES: /^\$?SYS\/([^/\n]*)\/new\/subscribes/,
  UNSUBSCRIBES: /^\$?SYS\/([^/\n]*)\/new\/unsubscribes/
};