export const KEY_SUBSCRIBE_OPTIONS = "__pigeon_subscribe_options";
export const KEY_SUBSCRIBER_PARAMS = "__pigeon_subscriber_params";

export const LOGGER_KEY =  "Pigeon MQTT"
export const INSTANCE_BROKER = "INSTANCE_BROKER";
export const PIGEON_OPTION_PROVIDER = "PIGEON_OPTION_PROVIDER";
export const PIGEON_LOGGER_PROVIDER = "PIGEON_LOGGER_PROVIDER";

export enum Transport {
  TCP,
  WS
}

export enum SystemTopicsEnum {
  PUBLISH = "$PIGEON/new/publish",
  CLIENT_READY = "$PIGEON/event/ready/clients",
  CLIENT = "$PIGEON/event/clients",
  CLIENT_DISCONNECT = "$PIGEON/event/disconnect/clients",
  CLIENT_ERROR = "$PIGEON/event/error/clients",
  KEEP_LIVE_TIMEOUT = "$PIGEON/event/keepalivetimeout",
  ACK = "$PIGEON/event/ack",
  PING = "$PIGEON/event/ping",
  CONNACK_SENT = "$PIGEON/event/connack/sent",
  CLOSED = "$PIGEON/event/closed",
  CONNECTION_ERROR = "$PIGEON/event/error/connection",
  SUBSCRIBES = "$PIGEON/event/subscribes",
  UNSUBSCRIBES = "$PIGEON/event/unsubscribes",
  AUTHENTICATE = "$PIGEON/handle/authenticate",
  PRE_CONNECT = "$PIGEON/handle/preconnect",
  AUTHORIZE_PUBLISH = "$PIGEON/handle/authorizePublish",
  AUTHORIZE_SUBSCRIBE = "$PIGEON/handle/authorizeSubscribe",
  AUTHORIZE_FORWARD = "$PIGEON/handle/authorizeForward",
  PUBLISHED = "$PIGEON/handle/published",
}

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