import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { DiscoveredMethodWithMeta, DiscoveryService } from "@golevelup/nestjs-discovery";
import {
  INSTANCE_BROKER,
  PIGEON_LOGGER_PROVIDER,
  PIGEON_OPTION_PROVIDER,
  KEY_SUBSCRIBE_OPTIONS,
  KEY_SUBSCRIBER_PARAMS,
  SystemTopicsEnum, LOGGER_KEY, SystemTopicRegexEnum
} from "pigeon.constant";
import Aedes from "aedes/types/instance";
import { Client } from "aedes";
import { ConnackPacket, ConnectPacket, PingreqPacket, PublishPacket, PubrelPacket, Subscription } from "aedes";
import { IPacket } from "mqtt-packet";

import {
  PigeonModuleOptions,
  MqttSubscribeOptions,
  PigeonSubscriber,
  MqttSubscriberParameter
} from "pigeon.interface";
import { isRegExp } from "util/types";
import { getTransform } from "pigeon.transfrom";

type DiscoveredMethodWithMetaAndParameters<T> = DiscoveredMethodWithMeta<T> & {
  params: MqttSubscriberParameter[];
};

type HandlerMethodParameters = {
  client?: Client;
  packet?: IPacket;
  subscription?: Subscription;
  subscriptions?: Subscription[];
  unsubscription?: string[];
  callback?: (...args: unknown[]) => unknown;
  username?: string;
  password?: Readonly<Buffer>;
  error?;
};


@Injectable()
export class PigeonExplorer implements OnModuleInit, OnApplicationShutdown {
  private readonly reflector = new Reflector();
  subscribers: PigeonSubscriber[];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(PIGEON_OPTION_PROVIDER) private readonly options: PigeonModuleOptions,
    @Inject(PIGEON_LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(INSTANCE_BROKER) private readonly broker: Aedes
  ) {
    this.subscribers = [];
  }

  onModuleInit() {
    Logger.log("Pigeon Explorer initialized", LOGGER_KEY);
    this.init();
  }

  async onApplicationShutdown(signal?: string) {
    Logger.error("Application Shutdown", LOGGER_KEY);
    await new Promise<void>((resolve) => this.broker.close(() => resolve()));
  }


  async init() {

    const providers: Array<DiscoveredMethodWithMetaAndParameters<string>> = (
      await this.discoveryService.providerMethodsWithMetaAtKey<string>(KEY_SUBSCRIBE_OPTIONS)
    ).map((p) => ({
      ...p,
      params: this.getMethodParameters(p)
    }));

    const preConnect = this.getSubscribers(SystemTopicsEnum.PRE_CONNECT, providers, true);
    if (preConnect.length > 0) {
      this.broker.preConnect = (client: Client, packet: ConnectPacket, callback) => {
        this.processHandlerListener(preConnect, {
          client,
          packet,
          callback
        });
      };
    }

    const clientDisconnect = this.getSubscribers(SystemTopicsEnum.CLIENT_DISCONNECT, providers);
    if (clientDisconnect.length > 0) {
      this.broker.on("clientDisconnect", (client: Client) => {
        this.processHandlerListener(clientDisconnect, { client });
      });
    }

    const authenticate = this.getSubscribers(SystemTopicsEnum.AUTHENTICATE, providers, true);
    if (authenticate.length > 0) {
      this.broker.authenticate = (client: Client, username: Readonly<string>, password: Readonly<Buffer>, callback) => {
        this.processHandlerListener(authenticate, {
          client,
          callback,
          username,
          password
        });
      };
    }

    const authorizePublish = this.getSubscribers(SystemTopicsEnum.AUTHORIZE_PUBLISH, providers, true);
    if (authorizePublish.length > 0) {
      this.broker.authorizePublish = (client: Client, packet: PublishPacket, callback) => {
        this.processHandlerListener(authorizePublish, {
          client,
          packet,
          callback
        });
      };
    }

    const authorizeSubscribe = this.getSubscribers(SystemTopicsEnum.AUTHORIZE_SUBSCRIBE, providers, true);
    if (authorizeSubscribe.length > 0) {
      this.broker.authorizeSubscribe = (client: Client, subscription: Subscription, callback) => {
        this.processHandlerListener(authorizeSubscribe, {
          client,
          subscription: subscription,
          callback
        });
      };
    }

    const authorizeForward = this.getSubscribers(SystemTopicsEnum.AUTHORIZE_FORWARD, providers, true);
    if (authorizeForward.length > 0) {
      this.broker.authorizeForward = (client: Client, packet: PublishPacket) => {
        this.processHandlerListener(authorizeForward, {
          client,
          packet
        });
      };
    }

    const published = this.getSubscribers(SystemTopicsEnum.PUBLISHED, providers, true);
    if (published.length > 0) {
      this.broker.published = (packet: PublishPacket, client: Client, callback) => {
        this.processHandlerListener(published, {
          client,
          packet,
          callback
        });
      };
    }

    this.broker.on("publish", (packet: PublishPacket, client: Client) => {
      let subscriber;

      if (SystemTopicRegexEnum.HEART_BEAT.test(packet.topic)) {
        subscriber = this.getSubscribers(SystemTopicRegexEnum.HEART_BEAT, providers);
      } else {
        subscriber = [
          ...this.getSubscribers(packet.topic, providers),
          ...this.getSubscribers(SystemTopicsEnum.PUBLISH, providers)
        ];
      }

      this.processHandlerListener(subscriber, { client, packet });
    });

    const clientReady = this.getSubscribers(SystemTopicsEnum.CLIENT_READY, providers, true);
    if (clientReady.length > 0) {
      this.broker.on("clientReady", (client: Client) => {
        this.processHandlerListener(clientReady, { client });
      });
    }

    const client = this.getSubscribers(SystemTopicsEnum.CLIENT, providers, true);
    if (client.length > 0) {
      this.broker.on("client", (c: Client) => {
        this.processHandlerListener(client, { client: c });
      });
    }


    const clientError = this.getSubscribers(SystemTopicsEnum.CLIENT_ERROR, providers, true);
    if (clientError.length > 0) {
      this.broker.on("clientError", (client: Client, error: Error) => {
        this.processHandlerListener(clientError, { client, error });
      });
    }

    const subscribe = this.getSubscribers(SystemTopicsEnum.SUBSCRIBES, providers, true);
    if (subscribe.length > 0) {
      this.broker.on("subscribe", (subscriptions: Subscription[], client: Client) => {
        this.processHandlerListener(subscribe, {
          client,
          subscriptions
        });
      });
    }

    const unsubscribe = this.getSubscribers(SystemTopicsEnum.UNSUBSCRIBES, providers, true);
    if (unsubscribe.length > 0) {
      this.broker.on("unsubscribe", (unsubscription: string[], client: Client) => {
        this.processHandlerListener(unsubscribe, {
          client,
          unsubscription
        });
      });
    }

    const ping = this.getSubscribers(SystemTopicsEnum.PING, providers, true);
    if (ping.length > 0) {
      this.broker.on("ping", (packet: PingreqPacket, client: Client) => {
        this.processHandlerListener(ping, { client, packet });
      });
    }

    const connectionError = this.getSubscribers(SystemTopicsEnum.CONNECTION_ERROR, providers, true);
    if (connectionError.length > 0) {
      this.broker.on("connectionError", (client: Client, error: Error) => {
        this.processHandlerListener(connectionError, { client, error });
      });
    }

    const keepaliveTimeout = this.getSubscribers(SystemTopicsEnum.KEEP_LIVE_TIMEOUT, providers, true);
    if (keepaliveTimeout.length > 0) {
      this.broker.on("keepaliveTimeout", (client: Client) => {
        this.processHandlerListener(keepaliveTimeout, { client });
      });
    }

    const ack = this.getSubscribers(SystemTopicsEnum.ACK, providers, true);
    if (ack.length > 0) {
      this.broker.on("ack", (packet: PublishPacket | PubrelPacket, client: Client) => {
        this.processHandlerListener(ack, { client, packet });
      });
    }

    const closed = this.getSubscribers(SystemTopicsEnum.CLOSED, providers, true);
    if (closed.length > 0) {
      this.broker.on("closed", () => {
        this.processHandlerListener(closed);
      });
    }

    const connackSent = this.getSubscribers(SystemTopicsEnum.CONNACK_SENT, providers, true);
    if (connackSent.length > 0) {
      this.broker.on("connackSent", (packet: ConnackPacket, client: Client) => {
        this.processHandlerListener(connackSent, { client, packet });
      });
    }

    for (const provider of providers) {
      this.logger.log(
        `Mapped {${provider.discoveredMethod.parentClass.name}::${
          provider.discoveredMethod.methodName
        }, ${provider.params.map((p) => `${p.type}`).join(", ")}} mqtt subscribtion`
      );
    }
  }

  processHandlerListener(
    subscribers: DiscoveredMethodWithMetaAndParameters<string>[],
    params?: HandlerMethodParameters
  ) {
    for (const subscriber of subscribers) {
      try {
        subscriber.discoveredMethod.handler.bind(subscriber.discoveredMethod.parentClass.instance)(
          ...this.getHandlerMethodParameters(subscriber.params, params)
        );
      } catch (err) {
        this.logger.error(err);
      }
    }
  }

  private getMethodParameters(subscriber: DiscoveredMethodWithMeta<string>): MqttSubscriberParameter[] {
    const parameters = this.reflector.get<MqttSubscriberParameter[]>(
      KEY_SUBSCRIBER_PARAMS,
      subscriber.discoveredMethod.handler
    );

    const orderedParameters: MqttSubscriberParameter[] = [];
    for (const parameter of parameters) {
      orderedParameters[parameter.index] = parameter;
    }
    return orderedParameters;
  }

  private getSubscribers(
    metaKey: string | RegExp,
    providers: DiscoveredMethodWithMetaAndParameters<string>[],
    single = false
  ): DiscoveredMethodWithMetaAndParameters<string>[] {
    const subscribers = providers.filter((p) => {
      return (isRegExp(metaKey) && metaKey.test(p.meta)) || p.meta === metaKey;
    });
    if (single && subscribers.length > 0) {
      return [subscribers[0]];
    }
    return subscribers;
  }


  private getHandlerMethodParameters(parameters: MqttSubscriberParameter[], params?: HandlerMethodParameters) {
    return parameters.map((parameter) => {
      switch (parameter?.type) {
        case "client":
          return params?.client;
        case "host":
          return this.getHost();
        case "credential":
          return {
            username: params?.username,
            password: params?.password
          };
        case "function":
          return params?.callback;
        case "subscription":
          return params?.subscription;
        case "subscriptions":
          return params?.subscriptions;
        case "payload":
          return getTransform(parameter.transform)((params?.packet as PublishPacket).payload);
        case "error":
          return params?.error;
        case "packet":
          return params?.packet;
        default:
          return null;
      }
    });
  }

  getHost() {
    return {
      id: this.broker.id,
      connectedClients: this.broker.connectedClients,
      closed: this.broker.closed
    };
  }

}