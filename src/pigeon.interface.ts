/**
 * PigeonExplorer is a NestJS service that provides the functionality to set up MQTT topics and message listeners.
 * It listens to the KEY_SUBSCRIBE_OPTIONS metadata and sets up the listeners based on the provided options.
 */
import { AedesOptions, PublishPacket } from 'aedes';
import { LoggerService, Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Transport } from 'enum/pigeon.transport.enum';

// Define a type for a function that can transform a message payload
export type MqttMessageTransformer<T> = (payload: string | Buffer) => T;

/**
 * Interface for specifying options when subscribing to MQTT topics.
 * - `topic`: The topic or topics to subscribe to.
 * - `queue`: (Optional) Whether messages should be queued for subscribers.
 * - `share`: (Optional) Group of subscribers sharing a queue.
 * - `transform`: (Optional) Transformation type for the payload (e.g., 'json', 'text', or custom transformer).
 */
export interface MqttSubscribeOptions {
  topic: string | string[];
  queue?: boolean;
  share?: string;
  transform?: 'json' | 'text' | MqttMessageTransformer<unknown>;
}

/**
 * Custom interface for MQTT Publish Packets with explicit properties.
 * - `cmd`: Command type for publishing ('publish').
 * - `qos`: Quality of Service (QoS) level (0, 1, or 2).
 * - `topic`: The topic of the published message.
 * - `payload`: The message payload (string or Buffer).
 */
export interface PubPacket extends PublishPacket {
  cmd: 'publish';
  qos: 0 | 1 | 2;
  topic: string;
  payload: string | Buffer;
}

/**
 * Interface for parameters used in MQTT subscriber functions.
 * - `index`: The index of the parameter in the subscriber function.
 * - `type`: The type of parameter being passed to the subscriber function, which can be one of the following:
 *    - 'error': Error object.
 *    - 'payload': Message payload.
 *    - 'topic': Message topic.
 *    - 'publish': Publish packet.
 *    - 'packet': MQTT packet.
 *    - 'client': MQTT client.
 *    - 'host': MQTT broker host information.
 *    - 'subscription': Subscription information.
 *    - 'subscriptions': Multiple subscriptions.
 *    - 'unsubscription': Unsubscription information.
 *    - 'function': Callback function.
 *    - 'credential': User credentials.
 * - `transform`: (Optional) Transformation type for the parameter, which can be 'json', 'text', or a custom transformation using MqttMessageTransformer<unknown>.
 */
export interface MqttSubscriberParameter {
  index: number;
  type:
    | 'error'
    | 'payload'
    | 'topic'
    | 'publish'
    | 'packet'
    | 'client'
    | 'host'
    | 'subscription'
    | 'subscriptions'
    | 'unsubscription'
    | 'function'
    | 'credential'; // The type of parameter being passed to the subscriber function
  transform?: 'json' | 'text' | MqttMessageTransformer<unknown>;
}

/**
 * Interface for configuring a Pigeon MQTT subscriber.
 * - `topic`: The topic or regex pattern to subscribe to, which can be a string or a regular expression.
 * - `handle`: The subscriber function to call when a message is received.
 * - `provider`: The object containing the subscriber function.
 * - `options`: Additional options for the subscriber, defined by the MqttSubscribeOptions interface.
 * - `parameters`: The parameters to pass to the subscriber function, defined by the MqttSubscriberParameter interface.
 */
export interface PigeonSubscriber {
  topic: RegExp | string;
  handle: any;
  provider: any;
  options: MqttSubscribeOptions;
  parameters: MqttSubscriberParameter[];
}

/**
 * Interface for configuring a logger for MQTT messages.
 * - `useValue`: An optional custom LoggerService instance to use.
 * - `useClass`: An optional LoggerService class to use for logging.
 */
export interface MqttLoggerOptions {
  useValue?: LoggerService;
  useClass?: Type<LoggerService>;
}

/**
 * Configuration options for a Pigeon MQTT module, extending the AedesOptions.
 * - `port`: The port to listen on for MQTT connections.
 * - `transport`: The port to listen on for MQTT over WebSockets connections.
 */
export interface PigeonModuleOptions extends AedesOptions {
  port: number; // The port to listen on for MQTT connections
  transport: Transport; // The port to listen on for MQTT over WebSockets connections
}

/**
 * Factory interface for creating Pigeon module options.
 * - `createPigeonConnectOptions`: A factory method for generating Pigeon module options.
 *   It can return either a `PigeonModuleOptions` object or a promise that resolves to `PigeonModuleOptions`.
 */
export interface PigeonOptionsFactory {
  createPigeonConnectOptions():
    | Promise<PigeonModuleOptions>
    | PigeonModuleOptions;
}

/**
 * Asynchronous options for configuring a Pigeon MQTT module.
 * - `imports`: An array of modules that should be imported.
 * - `inject`: An array of additional dependencies to inject.
 * - `useExisting`: An existing provider to use for creating options.
 * - `useClass`: A class to use for creating options.
 * - `useFactory`: A factory function to use for creating options.
 * - `logger`: Optional logger configuration for MQTT messages.
 */
export interface PigeonModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[]; // Additional dependencies to inject
  useExisting?: Type<PigeonOptionsFactory>; // An existing provider to use for creating options
  useClass?: Type<PigeonOptionsFactory>; // A class to use for creating options
  useFactory?: (
    ...args: any[]
  ) => Promise<PigeonOptionsFactory> | PigeonOptionsFactory; // A factory function to use for creating options
  logger?: MqttLoggerOptions; // Optional logger configuration for MQTT messages
}
