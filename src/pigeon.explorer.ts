/**
 * PigeonExplorer is a NestJS service that provides the functionality to set up MQTT topics and message listeners.
 * It listens to the KEY_SUBSCRIBE_OPTIONS metadata and sets up the listeners based on the provided options.
 */
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  DiscoveredMethodWithMeta,
  DiscoveryService,
} from '@golevelup/nestjs-discovery';
import {
  INSTANCE_BROKER,
  PIGEON_LOGGER_PROVIDER,
  PIGEON_OPTION_PROVIDER,
  KEY_SUBSCRIBE_OPTIONS,
  KEY_SUBSCRIBER_PARAMS,
  LOGGER_KEY,
} from 'pigeon.constant';
import Aedes from 'aedes';
import { Client } from 'aedes';
import {
  ConnackPacket,
  ConnectPacket,
  PingreqPacket,
  PublishPacket,
  PubrelPacket,
  Subscription,
} from 'aedes';
import { IPacket } from 'mqtt-packet';

import {
  PigeonModuleOptions,
  PigeonSubscriber,
  MqttSubscriberParameter,
} from 'pigeon.interface';
import { isRegExp } from 'util/types';
import { getTransform } from 'pigeon.transfrom';
import { SystemTopics } from 'enum/pigeon.topic.enum';

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

  // Initialize the PigeonExplorer class with necessary modules and services
  constructor(
    private readonly discoveryService: DiscoveryService,
    @Inject(PIGEON_OPTION_PROVIDER)
    private readonly options: PigeonModuleOptions,
    @Inject(PIGEON_LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(INSTANCE_BROKER) private readonly broker: Aedes,
  ) {
    this.subscribers = [];
  }

  // Execute onModuleInit when the module is initialized
  onModuleInit() {
    Logger.log('Pigeon Explorer initialized', LOGGER_KEY);
    this.init();
  }

  // Execute onApplicationShutdown when the application is shutting down
  async onApplicationShutdown(signal?: string) {
    Logger.error('Application Shutdown', LOGGER_KEY);
    await new Promise<void>((resolve) => this.broker.close(() => resolve()));
  }

  // Initialize the broker and set up listeners
  async init() {
    // Get providers from the KEY_SUBSCRIBE_OPTIONS metadata
    const providers: Array<DiscoveredMethodWithMetaAndParameters<string>> = (
      await this.discoveryService.providerMethodsWithMetaAtKey<string>(
        KEY_SUBSCRIBE_OPTIONS,
      )
    ).map((p) => ({
      ...p,
      params: this.getMethodParameters(p),
    }));

    // Set up preConnect listener
    const preConnect = this.getSubscribers(
      SystemTopics.PRE_CONNECT,
      providers,
      true,
    );
    if (preConnect.length > 0) {
      this.broker.preConnect = (
        client: Client,
        packet: ConnectPacket,
        callback,
      ) => {
        this.processHandlerListener(preConnect, {
          client,
          packet,
          callback,
        });
      };
    }

    // Set up clientDisconnect listener
    const clientDisconnect = this.getSubscribers(
      SystemTopics.CLIENT_DISCONNECT,
      providers,
    );
    if (clientDisconnect.length > 0) {
      this.broker.on('clientDisconnect', (client: Client) => {
        this.processHandlerListener(clientDisconnect, { client });
      });
    }

    // Set up authenticate listener
    const authenticate = this.getSubscribers(
      SystemTopics.AUTHENTICATE,
      providers,
      true,
    );
    if (authenticate.length > 0) {
      this.broker.authenticate = (
        client: Client,
        username: Readonly<string>,
        password: Readonly<Buffer>,
        callback,
      ) => {
        this.processHandlerListener(authenticate, {
          client,
          callback,
          username,
          password,
        });
      };
    }

    // Set up authorizePublish listener
    const authorizePublish = this.getSubscribers(
      SystemTopics.AUTHORIZE_PUBLISH,
      providers,
      true,
    );
    if (authorizePublish.length > 0) {
      this.broker.authorizePublish = (
        client: Client,
        packet: PublishPacket,
        callback,
      ) => {
        this.processHandlerListener(authorizePublish, {
          client,
          packet,
          callback,
        });
      };
    }

    // Set up authorizeSubscribe listener
    const authorizeSubscribe = this.getSubscribers(
      SystemTopics.AUTHORIZE_SUBSCRIBE,
      providers,
      true,
    );
    if (authorizeSubscribe.length > 0) {
      this.broker.authorizeSubscribe = (
        client: Client,
        subscription: Subscription,
        callback,
      ) => {
        this.processHandlerListener(authorizeSubscribe, {
          client,
          subscription: subscription,
          callback,
        });
      };
    }

    // Set up authorizeForward listener
    const authorizeForward = this.getSubscribers(
      SystemTopics.AUTHORIZE_FORWARD,
      providers,
      true,
    );
    if (authorizeForward.length > 0) {
      this.broker.authorizeForward = (
        client: Client,
        packet: PublishPacket,
      ) => {
        this.processHandlerListener(authorizeForward, {
          client,
          packet,
        });
      };
    }

    // Set up published listener
    const published = this.getSubscribers(
      SystemTopics.PUBLISHED,
      providers,
      true,
    );
    if (published.length > 0) {
      this.broker.published = (
        packet: PublishPacket,
        client: Client,
        callback,
      ) => {
        this.processHandlerListener(published, {
          client,
          packet,
          callback,
        });
      };
    }

    // Set up an event listener on the "publish" event of a broker object
    this.broker.on('publish', (packet: PublishPacket, client: Client) => {
      let subscriber;

      // If the packet's topic matches the "HEART_BEAT" regular expression
      if (SystemTopics.HEART_BEAT.test(packet.topic)) {
        // Retrieve the subscribers whose meta matches the "HEART_BEAT" regular expression
        subscriber = this.getSubscribers(
            SystemTopics.HEART_BEAT,
          providers,
        );
      } else {
        // Retrieve subscribers whose meta matches the packet's topic and subscribers whose meta matches the "PUBLISH" system topic
        subscriber = [
          ...this.getSubscribers(packet.topic, providers),
          ...this.getSubscribers(SystemTopics.PUBLISH, providers),
        ];
      }
      // Call the `processHandlerListener` method with the retrieved subscribers and the client and packet information
      this.processHandlerListener(subscriber, { client, packet });
    });

    // Set up clientReady listener
    const clientReady = this.getSubscribers(
      SystemTopics.CLIENT_READY,
      providers,
      true,
    );
    if (clientReady.length > 0) {
      this.broker.on('clientReady', (client: Client) => {
        this.processHandlerListener(clientReady, { client });
      });
    }

    // Set up client listener
    const client = this.getSubscribers(SystemTopics.CLIENT, providers, true);
    if (client.length > 0) {
      this.broker.on('client', (c: Client) => {
        this.processHandlerListener(client, { client: c });
      });
    }

    // Set up clientError listener
    const clientError = this.getSubscribers(
      SystemTopics.CLIENT_ERROR,
      providers,
      true,
    );
    if (clientError.length > 0) {
      this.broker.on('clientError', (client: Client, error: Error) => {
        this.processHandlerListener(clientError, { client, error });
      });
    }

    // Set up subscribe listener
    const subscribe = this.getSubscribers(
      SystemTopics.SUBSCRIBES,
      providers,
      true,
    );
    if (subscribe.length > 0) {
      this.broker.on(
        'subscribe',
        (subscriptions: Subscription[], client: Client) => {
          this.processHandlerListener(subscribe, {
            client,
            subscriptions,
          });
        },
      );
    }

    // Set up unsubscribe listener
    const unsubscribe = this.getSubscribers(
      SystemTopics.UNSUBSCRIBES,
      providers,
      true,
    );
    if (unsubscribe.length > 0) {
      this.broker.on(
        'unsubscribe',
        (unsubscription: string[], client: Client) => {
          this.processHandlerListener(unsubscribe, {
            client,
            unsubscription,
          });
        },
      );
    }

    // Set up ping listener
    const ping = this.getSubscribers(SystemTopics.PING, providers, true);
    if (ping.length > 0) {
      this.broker.on('ping', (packet: PingreqPacket, client: Client) => {
        this.processHandlerListener(ping, { client, packet });
      });
    }

    // Set up connectionError listener
    const connectionError = this.getSubscribers(
      SystemTopics.CONNECTION_ERROR,
      providers,
      true,
    );
    if (connectionError.length > 0) {
      this.broker.on('connectionError', (client: Client, error: Error) => {
        this.processHandlerListener(connectionError, { client, error });
      });
    }

    // Set up keepaliveTimeout listener
    const keepaliveTimeout = this.getSubscribers(
      SystemTopics.KEEP_LIVE_TIMEOUT,
      providers,
      true,
    );
    if (keepaliveTimeout.length > 0) {
      this.broker.on('keepaliveTimeout', (client: Client) => {
        this.processHandlerListener(keepaliveTimeout, { client });
      });
    }

    // Set up ack listener
    const ack = this.getSubscribers(SystemTopics.ACK, providers, true);
    if (ack.length > 0) {
      this.broker.on(
        'ack',
        (packet: PublishPacket | PubrelPacket, client: Client) => {
          this.processHandlerListener(ack, { client, packet });
        },
      );
    }

    // Set up closed listener
    const closed = this.getSubscribers(SystemTopics.CLOSED, providers, true);
    if (closed.length > 0) {
      this.broker.on('closed', () => {
        this.processHandlerListener(closed);
      });
    }

    // Set up connackSent listener
    const connackSent = this.getSubscribers(
      SystemTopics.CONNACK_SENT,
      providers,
      true,
    );
    if (connackSent.length > 0) {
      this.broker.on('connackSent', (packet: ConnackPacket, client: Client) => {
        this.processHandlerListener(connackSent, { client, packet });
      });
    }

    for (const provider of providers) {
      Logger.log(
        `Mapped ${provider.discoveredMethod.methodName}, ${provider.params
          .map((p) => `${p.type}`)
          .join(', ')}} subscribtion`,
        provider.discoveredMethod.parentClass.name,
      );
    }
  }

  // This function takes in an array of subscribers and their parameters, then processes each subscriber's method.
  // If there's an error, it logs it using a logger.
  processHandlerListener(
    subscribers: DiscoveredMethodWithMetaAndParameters<string>[],
    params?: HandlerMethodParameters,
  ) {
    for (const subscriber of subscribers) {
      try {
        // Bind the handler method to the parent class's instance, then call it with the necessary parameters.
        subscriber.discoveredMethod.handler.bind(
          subscriber.discoveredMethod.parentClass.instance,
        )(...this.getHandlerMethodParameters(subscriber.params, params));
      } catch (err) {
        // Log any errors that occur during the call.
        this.logger.error(err);
      }
    }
  }

  // This function takes in a subscriber, and returns an array of parameters for that subscriber's handler method.
  // It does this by retrieving the MqttSubscriberParameter metadata using the reflector, then ordering them by index.
  private getMethodParameters(
    subscriber: DiscoveredMethodWithMeta<string>,
  ): MqttSubscriberParameter[] {
    const parameters = this.reflector.get<MqttSubscriberParameter[]>(
      KEY_SUBSCRIBER_PARAMS,
      subscriber.discoveredMethod.handler,
    );

    if (!Array.isArray(parameters)) {
      return [];
    }

    const orderedParameters: MqttSubscriberParameter[] = [];
    for (const parameter of parameters) {
      orderedParameters[parameter.index] = parameter;
    }
    return orderedParameters;
  }

  // This function takes in a metaKey (either a string or RegExp), an array of providers,
  // and a boolean indicating whether to only return the first match.
  // It returns an array of all subscribers whose metadata matches the given metaKey.
  private getSubscribers(
    metaKey: string | RegExp,
    providers: DiscoveredMethodWithMetaAndParameters<string>[],
    single = false,
  ): DiscoveredMethodWithMetaAndParameters<string>[] {
    const subscribers = providers.filter((p) => {
      return (
        (isRegExp(p.meta) && p.meta.test(String(metaKey))) || p.meta === metaKey
      );
    });
    if (single && subscribers.length > 0) {
      return [subscribers[0]];
    }
    return subscribers;
  }

  // This function takes in an array of MqttSubscriberParameters and a HandlerMethodParameters object.
  // It maps each parameter to its corresponding value from the HandlerMethodParameters object, then returns the resulting array.
  private getHandlerMethodParameters(
    parameters: MqttSubscriberParameter[],
    params?: HandlerMethodParameters,
  ) {
    return parameters.map((parameter) => {
      switch (parameter?.type) {
        case 'client':
          return params?.client;
        case 'host':
          return this.getHost();
        case 'credential':
          return {
            username: params?.username,
            password: params?.password,
          };
        case 'function':
          return params?.callback;
        case 'subscription':
          return params?.subscription;
        case 'subscriptions':
          return params?.subscriptions;
        case 'unsubscription':
          return params?.unsubscription;
        case 'payload':
          return getTransform(parameter.transform)(
            (params?.packet as PublishPacket).payload,
          );
        case 'error':
          return params?.error;
        case 'packet':
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
      closed: this.broker.closed,
    };
  }
}
