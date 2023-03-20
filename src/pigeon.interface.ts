import { AedesOptions, PublishPacket } from "aedes";
import { LoggerService, Type } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";

export type MqttMessageTransformer<T> = (payload: string | Buffer) => T;

export interface MqttSubscribeOptions {
  topic: string | string[];
  queue?: boolean;
  share?: string;
  transform?: "json" | "text" | MqttMessageTransformer<unknown>;
}

export interface PubPacket extends PublishPacket {
  cmd: "publish";
  qos: 0 | 1 | 2;
  topic: string;
  payload: string | Buffer;
}

export class CredentialInterface {
  username: string;
  password: Buffer;
}

export interface MqttSubscriberParameter {
  index: number;
  type: "error" |"payload" | "topic" | "publish" | "packet" | "client" | "host" | "subscription" | "function" | "credential";
  transform?: "json" | "text" | MqttMessageTransformer<unknown>;
}

export interface PigeonSubscriber {
  topic: RegExp | string;
  handle: any;
  provider: any;
  options: MqttSubscribeOptions;
  parameters: MqttSubscriberParameter[];
}

export interface MqttLoggerOptions {
  useValue?: LoggerService;
  useClass?: Type<LoggerService>;
}

export interface PigeonModuleOptions extends AedesOptions {
  port?: number;
  portWs?:number;
}

export interface PigeonOptionsFactory {
  createPigeonConnectOptions(): Promise<PigeonModuleOptions> | PigeonModuleOptions;
}

export interface PigeonModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<PigeonOptionsFactory>;
  useClass?: Type<PigeonOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<PigeonOptionsFactory> | PigeonOptionsFactory;
  logger?: MqttLoggerOptions;
}