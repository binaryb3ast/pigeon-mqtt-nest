import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import {
  INSTANCE_BROKER,
  PIGEON_LOGGER_PROVIDER,
  PIGEON_OPTION_PROVIDER,
  KEY_SUBSCRIBE_OPTIONS,
  KEY_SUBSCRIBER_PARAMS,
  SystemTopicsEnum, LOGGER_KEY
} from "pigeon.constant";
import Aedes from "aedes/types/instance";
import { Client } from 'aedes';
import { ConnackPacket, ConnectPacket, PingreqPacket, PublishPacket, PubrelPacket, Subscription } from 'aedes';

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
    Logger.log("Pigeon Explorer initialized", LOGGER_KEY)
    this.init();
  }

  init() {
    this.collectProviders();
    const preConnectSubscriber = this.getSubscriber(SystemTopicsEnum.PRE_CONNECT);
    if (preConnectSubscriber) {
      Logger.log("Listen on <preConnect>", LOGGER_KEY)
      this.broker.preConnect = (client: Client, packet: ConnectPacket, done) => {
        this.processHandlerListener(preConnectSubscriber, client, packet, null, done, null, null, null);
      };
    }

    const authenticateSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHENTICATE);
    if (authenticateSubscriber) {
      Logger.log("Listen on <authenticate>", LOGGER_KEY)
      this.broker.authenticate = (client: Client, username: Readonly<string>, password: Readonly<Buffer>, done) => {
        this.processHandlerListener(authenticateSubscriber, client, null, null, done, username, password, null);
      };
    }

    const authorizePublishSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHORIZE_PUBLISH);
    if (authorizePublishSubscriber) {
      Logger.log("Listen on <authorizePublish>", LOGGER_KEY)
      this.broker.authorizePublish = (client: Client, packet: PublishPacket, done) => {
        this.processHandlerListener(authorizePublishSubscriber, client, packet, null, done, null, null, null);
      };
    }

    const authorizeSubscribeSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHORIZE_SUBSCRIBE);
    if (authorizeSubscribeSubscriber) {
      Logger.log("Listen on <authorizeSubscribe>", LOGGER_KEY)
      this.broker.authorizeSubscribe = (client: Client, subscription: Subscription, done) => {
        this.processHandlerListener(authorizeSubscribeSubscriber, client, null, subscription, done, null, null, null);
      };
    }

    const authorizeForwardSubscriber = this.getSubscriber(SystemTopicsEnum.AUTHORIZE_FORWARD);
    if (authorizeForwardSubscriber) {
      Logger.log("Listen on <authorizeForward>", LOGGER_KEY)
      this.broker.authorizeForward = (client: Client, packet: PublishPacket) => {
        this.processHandlerListener(authorizeForwardSubscriber, client, packet, null, null, null, null, null);
      };
    }

    const publishedSubscriber = this.getSubscriber(SystemTopicsEnum.PUBLISHED);
    if (publishedSubscriber) {
      Logger.log("Listen on <published>", LOGGER_KEY)
      this.broker.published = (packet: PublishPacket, client: Client, cb) => {
        this.processHandlerListener(publishedSubscriber, client, packet, null, cb, null, null, null);
      };
    }

    this.broker.on("publish", (packet: PublishPacket, client: Client) => {
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
      Logger.log("Listen on <clientReady>", LOGGER_KEY)
      this.broker.on("clientReady", (client: Client) => {
        this.processHandlerListener(clientReadySubscriber, client, null, null, null, null, null, null);
      });
    }

    const clientSubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT);
    if (clientSubscriber) {
      Logger.log("Listen on <client>", LOGGER_KEY)
      this.broker.on("client", (client: Client) => {
        this.processHandlerListener(clientSubscriber, client, null, null, null, null, null, null);

      });
    }

    const clientDisconnectSubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT_DISCONNECT);
    if (clientDisconnectSubscriber) {
      Logger.log("Listen on <clientDisconnect>", LOGGER_KEY)
      this.broker.on("clientDisconnect", (client: Client) => {
        this.processHandlerListener(clientDisconnectSubscriber, client, null, null, null, null, null, null);
      });
    }

    const clientErrorSubscriber = this.getSubscriber(SystemTopicsEnum.CLIENT_ERROR);
    if (clientErrorSubscriber) {
      Logger.log("Listen on <clientError>", LOGGER_KEY)
      this.broker.on("clientError", (client: Client, error: Error) => {
        this.processHandlerListener(clientErrorSubscriber, client, null, null, null, null, null, error);
      });
    }

    const subscribeSubscriber = this.getSubscriber(SystemTopicsEnum.SUBSCRIBES);
    if (subscribeSubscriber) {
      Logger.log("Listen on <subscribe>", LOGGER_KEY)
      this.broker.on("subscribe", (subscription: Subscription[], client: Client) => {
        this.processHandlerListener(subscribeSubscriber, client, null, subscription, null, null, null, null);
      });
    }

    const unsubscribeSubscriber = this.getSubscriber(SystemTopicsEnum.UNSUBSCRIBES);
    if (unsubscribeSubscriber) {
      Logger.log("Listen on <unsubscribe>", LOGGER_KEY)
      this.broker.on("unsubscribe", (unsubscription: string[], client: Client) => {
        this.processHandlerListener(unsubscribeSubscriber, client, null, unsubscription, null, null, null, null);
      });
    }

    const pingSubscriber = this.getSubscriber(SystemTopicsEnum.PING);
    if (pingSubscriber) {
      Logger.log("Listen on <ping>", LOGGER_KEY)
      this.broker.on("ping", (packet: PingreqPacket, client: Client) => {
        this.processHandlerListener(pingSubscriber, client, packet, null, null, null, null, null);
      });
    }

    const connectionErrorSubscriber = this.getSubscriber(SystemTopicsEnum.CONNECTION_ERROR);
    if (connectionErrorSubscriber) {
      Logger.log("Listen on <connectionError>", LOGGER_KEY)
      this.broker.on("connectionError", (client: Client,error:Error) => {
        this.processHandlerListener(connectionErrorSubscriber, client, null, null, null, null, null, error);
      });
    }

    const keepLiveTimeoutSubscriber = this.getSubscriber(SystemTopicsEnum.KEEP_LIVE_TIMEOUT);
    if (keepLiveTimeoutSubscriber) {
      Logger.log("Listen on <keepaliveTimeout>", LOGGER_KEY)
      this.broker.on("keepaliveTimeout", (client: Client) => {
        this.processHandlerListener(keepLiveTimeoutSubscriber, client, null, null, null, null, null, null);

      });
    }

    const ackSubscriber = this.getSubscriber(SystemTopicsEnum.ACK);
    if (ackSubscriber) {
      Logger.log("Listen on <ack>", LOGGER_KEY)
      this.broker.on("ack", (packet: PublishPacket | PubrelPacket, client: Client) => {
        this.processHandlerListener(ackSubscriber, client, packet, null, null, null, null, null);

      });
    }

    const closedSubscriber = this.getSubscriber(SystemTopicsEnum.CLOSED);
    if (closedSubscriber) {
      Logger.log("Listen on <closed>", LOGGER_KEY)
      this.broker.on("closed", () => {
        this.processHandlerListener(closedSubscriber, null, null, null, null, null, null, null);

      });
    }

    const connackSentSubscriber = this.getSubscriber(SystemTopicsEnum.CONNACK_SENT);
    if (connackSentSubscriber) {
      Logger.log("Listen on <connackSent>", LOGGER_KEY)
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
    Logger.log("Collecting Providers...", LOGGER_KEY)
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
    Logger.log(`Providers collected : ${this.subscribers.length}`, LOGGER_KEY)

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