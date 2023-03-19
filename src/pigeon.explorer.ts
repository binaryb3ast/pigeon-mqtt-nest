import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import {
  INSTANCE_BROKER,
  PIGEON_LOGGER_PROVIDER,
  PIGEON_OPTION_PROVIDER,
  KEY_SUBSCRIBE_OPTIONS,
  KEY_SUBSCRIBER_PARAMS,
  SystemTopicsEnum
} from "pigeon.constant";
import Aedes, {
  Client,
  ConnackPacket,
  ConnectPacket,
  PingreqPacket,
  PublishPacket,
  PubrelPacket,
  Subscription
} from "aedes";
import {
  PigeonModuleOptions,
  MqttSubscribeOptions,
  PigeonSubscriber,
  MqttSubscriberParameter
} from "pigeon.interface";

@Injectable()
export class PigeonExplorer implements OnModuleInit {
  private readonly reflector = new Reflector();
  subscribers: PigeonSubscriber[];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(PIGEON_OPTION_PROVIDER) private readonly options: PigeonModuleOptions,
    @Inject(PIGEON_LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(INSTANCE_BROKER) private readonly broker:Aedes
  ) {
    this.subscribers = [];
  }

  onModuleInit() {
    Logger.log(this, "init module");
    this.init();
  }

  init() {
    this.collectProviders();
    const preConnectSubscriber = this.getSubscriber(SystemTopicsEnum.PRE_CONNECT);
    if (preConnectSubscriber) {
      this.broker.preConnect = (client: Client, packet: ConnectPacket, done) => {
        this.processHandlerListener(preConnectSubscriber, client, packet, null, done, null, null, null);
      };
    }

    const authenticateSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHENTICATE);
    if (authenticateSubscriber) {
      this.broker.authenticate = (client: Client, username: Readonly<string>, password: Readonly<Buffer>, done) => {
        this.processHandlerListener(authenticateSubscriber, client, null, null, done, username, password, null);
      };
    }

    const authorizePublishSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHORIZE_PUBLISH);
    if (authorizePublishSubscriber) {
      this.broker.authorizePublish = (client: Client, packet: PublishPacket, done) => {
        this.processHandlerListener(authorizePublishSubscriber, client, packet, null, done, null, null, null);
      };
    }

    const authorizeSubscribeSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHORIZE_SUBSCRIBE);
    if (authorizeSubscribeSubscriber) {
      this.broker.authorizeSubscribe = (client: Client, subscription: Subscription, done) => {
        this.processHandlerListener(authorizeSubscribeSubscriber, client, null, subscription, done, null, null, null);
      };
    }

    const authorizeForwardSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHORIZE_FORWARD);
    if (authorizeForwardSubscriber) {
      this.broker.authorizeForward = (client: Client, packet: PublishPacket) => {
        this.processHandlerListener(authorizeForwardSubscriber, client, packet, null, null, null, null, null);
      };
    }

    const publishedSubscriber = this.getSubscriber(SystemTopicsEnum.PUBLISHED);
    if (publishedSubscriber) {
      this.broker.published = (packet: PublishPacket, client: Client, cb) => {
        this.processHandlerListener(publishedSubscriber, client, packet, null, cb, null, null, null);
      };
    }

    this.broker.on("publish", (packet: PublishPacket, client: Client) => {
      console.log(packet.topic);
      const subscriber = this.getSubscriber(packet.topic);
      const publish = this.getSubscriber(SystemTopicsEnum.PUBLISH);
      if (subscriber) {
        this.processHandlerListener(subscriber, client, packet, null, null, null, null, null);

      } else if (publish) {
        this.processHandlerListener(publish, client, packet, null, null, null, null, null);
      }
    });

    const clientReadySubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT_READY);
    if (clientReadySubscriber) {
      this.broker.on("clientReady", (client: Client) => {
        this.processHandlerListener(clientReadySubscriber, client, null, null, null, null, null, null);
      });
    }

    const clientSubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT);
    if (clientSubscriber) {
      this.broker.on("client", (client: Client) => {
        this.processHandlerListener(clientSubscriber, client, null, null, null, null, null, null);

      });
    }

    const clientDisconnectSubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT_DISCONNECT);
    if (clientDisconnectSubscriber) {
      this.broker.on("clientDisconnect", (client: Client) => {
        this.processHandlerListener(clientDisconnectSubscriber, client, null, null, null, null, null, null);
      });
    }

    const clientErrorSubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT_ERROR);
    if (clientErrorSubscriber) {
      this.broker.on("clientError", (client: Client, error: Error) => {
        this.processHandlerListener(clientErrorSubscriber, client, null, null, null, null, null, error);
      });
    }

    const subscribeSubscriber = this.getSubscriber(SystemTopicsEnum.SUBSCRIBES);
    if (subscribeSubscriber) {
      this.broker.on("subscribe", (subscription: Subscription[], client: Client) => {
        this.processHandlerListener(subscribeSubscriber, client, null, subscription, null, null, null, null);
      });
    }

    const unsubscribeSubscriber = this.getSubscriber(SystemTopicsEnum.UNSUBSCRIBES);
    if (unsubscribeSubscriber) {
      this.broker.on("unsubscribe", (unsubscription: string[], client: Client) => {
        this.processHandlerListener(unsubscribeSubscriber, client, null, unsubscription, null, null, null, null);
      });
    }

    const pingSubscriber = this.getSubscriber(SystemTopicsEnum.PING);
    if (pingSubscriber) {
      this.broker.on("ping", (packet: PingreqPacket, client: Client) => {
        this.processHandlerListener(pingSubscriber, client, packet, null, null, null, null, null);
      });
    }

    const connectionErrorSubscriber = this.getSubscriber(SystemTopicsEnum.CONNECTION_ERROR);
    if (connectionErrorSubscriber) {
      this.broker.on("connectionError", (client: Client,error:Error) => {
        this.processHandlerListener(connectionErrorSubscriber, client, null, null, null, null, null, error);
      });
    }

    const keepLiveTimeoutSubscriber = this.getSubscriber(SystemTopicsEnum.KEEP_LIVE_TIMEOUT);
    if (keepLiveTimeoutSubscriber) {
      this.broker.on("keepaliveTimeout", (client: Client) => {
        this.processHandlerListener(keepLiveTimeoutSubscriber, client, null, null, null, null, null, null);

      });
    }

    const ackSubscriber = this.getSubscriber(SystemTopicsEnum.ACK);
    if (ackSubscriber) {
      this.broker.on("ack", (packet: PublishPacket | PubrelPacket, client: Client) => {
        this.processHandlerListener(ackSubscriber, client, packet, null, null, null, null, null);

      });
    }

    const closedSubscriber = this.getSubscriber(SystemTopicsEnum.CLOSED);
    if (closedSubscriber) {
      this.broker.on("closed", () => {
        this.processHandlerListener(closedSubscriber, null, null, null, null, null, null, null);

      });
    }

    const connackSentSubscriber = this.getSubscriber(SystemTopicsEnum.CONNACK_SENT);
    if (connackSentSubscriber) {
      this.broker.on("connackSent", (packet: ConnackPacket, client: Client) => {
        this.processHandlerListener(connackSentSubscriber, client, packet, null, null, null, null, null);
      });
    }
  }

  processHandlerListener(subscriber, client, packet, subscription, callback, username, password, error) {
    const parameters = subscriber.parameters || [];
    const scatterParameters: MqttSubscriberParameter[] = [];
    for (const parameter of parameters) {
      scatterParameters[parameter.index] = parameter;
    }
    try {
      subscriber.handle.bind(subscriber.provider)(
        ...scatterParameters.map(parameter => {
          switch (parameter?.type) {
            case "client":
              return client;
            case "host":
              return this.getHost();
            case "credential":
              return {
                username,
                password
              };
            case "function":
              return callback;
            case "subscription":
              return subscription;
            case "payload":
              return packet.payload ? packet.payload : null;
            case "error":
              return error;
            case "packet":
              return packet;
            default:
              return null;
          }
        }));
    } catch (err) {
      this.logger.error(err);
    }
  }

  collectProviders() {
    const providers: InstanceWrapper[] = this.discoveryService.getProviders();
    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance) {
        return;
      }
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        key => {
          const subscribeOptions: MqttSubscribeOptions = this.reflector.get(
            KEY_SUBSCRIBE_OPTIONS,
            instance[key]
          );
          const parameters = this.reflector.get(
            KEY_SUBSCRIBER_PARAMS,
            instance[key]
          );
          if (subscribeOptions) {
            (Array.isArray(subscribeOptions.topic) ? subscribeOptions.topic : [subscribeOptions])
              .forEach(topic => {
                this.subscribers.push({
                  topic: topic.topic ? topic.topic : topic,
                  parameters: parameters,
                  handle: instance[key],
                  provider: instance,
                  options: subscribeOptions
                });
              });
          }
        }
      );
    });
  }

  getHost() {
    return {
      id: this.broker.id,
      connectedClients: this.broker.connectedClients,
      closed:this.broker.closed
    };
  }

  private getSubscriber(topic: string): PigeonSubscriber | null {
    for (const subscriber of this.subscribers) {
      if (typeof subscriber.topic == "string") {
        if (subscriber.topic === topic) {
          return subscriber;
        }
      } else if (typeof subscriber.topic == "object") {
        if (subscriber.topic.test(topic)) {
          return subscriber;
        }
      }
    }
    return null;
  }

}