import { AedesOptions, PublishPacket } from "aedes";
import { LoggerService, Type } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import {Transport} from "enum/pigeon.transport.enum";


// Define a type for a function that can transform a message payload
export type MqttMessageTransformer<T> = (payload: string | Buffer) => T;

// Options for subscribing to MQTT topics
export interface MqttSubscribeOptions {
  topic: string | string[];
  queue?: boolean;
  share?: string;
  transform?: "json" | "text" | MqttMessageTransformer<unknown>;
}

// Custom PublishPacket type with explicit properties
export interface PubPacket extends PublishPacket {
  cmd: "publish";
  qos: 0 | 1 | 2;
  topic: string;
  payload: string | Buffer;
}

// Parameters for a subscriber function
export interface MqttSubscriberParameter {
  index: number;
  type:
    | "error"
    | "payload"
    | "topic"
    | "publish"
    | "packet"
    | "client"
    | "host"
    | "subscription"
    | "subscriptions"
    | "unsubscription"
    | "function"
    | "credential"; // The type of parameter being passed to the subscriber function
  transform?: "json" | "text" | MqttMessageTransformer<unknown>;
}

// Options for subscribing to MQTT topics with a subscriber function
export interface PigeonSubscriber {
  topic: RegExp | string; // The topic or regex pattern to subscribe to
  handle: any; // The subscriber function to call when a message is received
  provider: any; // The object containing the subscriber function
  options: MqttSubscribeOptions; // Additional options for the subscriber
  parameters: MqttSubscriberParameter[]; // The parameters to pass to the subscriber function
}

// Options for configuring a logger for MQTT messages
export interface MqttLoggerOptions {
  useValue?: LoggerService;
  useClass?: Type<LoggerService>;
}

// Options for configuring a Pigeon MQTT module
export interface PigeonModuleOptions extends AedesOptions {
  port : number; // The port to listen on for MQTT connections
  transport: Transport ; // The port to listen on for MQTT over WebSockets connections
}

// Factory interface for creating Pigeon module options
export interface PigeonOptionsFactory {
  createPigeonConnectOptions(): Promise<PigeonModuleOptions> | PigeonModuleOptions;
}


// Asynchronous options for configuring a Pigeon MQTT module
export interface PigeonModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[]; // Additional dependencies to inject
  useExisting?: Type<PigeonOptionsFactory>; // An existing provider to use for creating options
  useClass?: Type<PigeonOptionsFactory>; // A class to use for creating options
  useFactory?: (...args: any[]) => Promise<PigeonOptionsFactory> | PigeonOptionsFactory; // A factory function to use for creating options
  logger?: MqttLoggerOptions; // Optional logger configuration for MQTT messages
}