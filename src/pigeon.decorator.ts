import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { KEY_SUBSCRIBE_OPTIONS, KEY_SUBSCRIBER_PARAMS } from 'pigeon.constant';
import {
  MqttMessageTransformer,
  MqttSubscribeOptions,
  MqttSubscriberParameter,
} from 'pigeon.interface';
import { SystemTopics } from 'enum/pigeon.topic.enum';

/**
 * Decorator to set metadata for subscribing to a specific MQTT topic.
 * @constructor
 */
export function ListenOn(
  topic: string | string[] | RegExp | RegExp[] | MqttSubscribeOptions,
): CustomDecorator;

/**
 * Implementation of ListenOn decorator.
 * @constructor
 */
export function ListenOn(topicOrOptions): CustomDecorator {
  if (typeof topicOrOptions === 'string' || Array.isArray(topicOrOptions)) {
    return SetMetadata(KEY_SUBSCRIBE_OPTIONS, topicOrOptions);
  } else {
    return SetMetadata(KEY_SUBSCRIBE_OPTIONS, topicOrOptions);
  }
}

/**
 * Decorator to listen on the HEART_BEAT topic.
 * @constructor
 */
export function onHeartBeat(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.HEART_BEAT);
}

/**
 * Decorator to listen on the PUBLISH topic.
 * @constructor
 */
export function onPublish(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.PUBLISH);
}

/**
 * Decorator to listen on the CLIENT_READY topic.
 * @constructor
 */
export function onClientReady(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT_READY);
}

/**
 * Decorator to listen on the CLIENT topic.
 * @constructor
 */
export function onClient(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT);
}

/**
 * Decorator to listen on the CLIENT_DISCONNECT topic.
 * @constructor
 */
export function onClientDisconnect(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT_DISCONNECT);
}

/**
 * Decorator to listen on the CLIENT_ERROR topic.
 * @constructor
 */
export function onClientError(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT_ERROR);
}

/**
 * Decorator to listen on the SUBSCRIBES topic.
 * @constructor
 */
export function onSubscribe(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.SUBSCRIBES);
}

/**
 * Decorator to listen on the UNSUBSCRIBES topic.
 * @constructor
 */
export function onUnsubscribe(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.UNSUBSCRIBES);
}

/**
 * Decorator to listen on the AUTHENTICATE topic.
 * @constructor
 */
export function onAuthenticate(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHENTICATE);
}

/**
 * Decorator to listen on the PRE_CONNECT topic.
 * @constructor
 */
export function onPreConnect(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.PRE_CONNECT);
}

/**
 * Decorator to listen on the AUTHORIZE_PUBLISH topic.
 * @constructor
 */
export function onAuthorizePublish(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHORIZE_PUBLISH);
}

/**
 * Decorator to listen on the AUTHORIZE_SUBSCRIBE topic.
 * @constructor
 */
export function onAuthorizeSubscribe(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHORIZE_SUBSCRIBE);
}

/**
 * Decorator to listen on the AUTHORIZE_FORWARD topic.
 * @constructor
 */
export function onAuthorizeForward(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHORIZE_FORWARD);
}

/**
 * Decorator to listen on the PUBLISHED topic.
 * @constructor
 */
export function onPublished(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.PUBLISHED);
}

/**
 * Decorator to listen on the KEEP_LIVE_TIMEOUT topic.
 * @constructor
 */
export function onKeepLiveTimeout(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.KEEP_LIVE_TIMEOUT);
}

/**
 * Decorator to listen on the ACK topic.
 * @constructor
 */
export function onAck(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.ACK);
}

/**
 * Decorator to listen on the CONNACK_SENT topic.
 * @constructor
 */
export function onConnackSent(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CONNACK_SENT);
}

/**
 * Decorator to listen on the CLOSED topic.
 * @constructor
 */
export function onClosed(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLOSED);
}

/**
 * Decorator to listen on the CONNECTION_ERROR topic.
 * @constructor
 */
export function onConnectionError(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CONNECTION_ERROR);
}

/**
 * Set metadata for parameters of an MQTT subscriber.
 * @constructor
 */
function SetParameter(parameter: Partial<MqttSubscriberParameter>) {
  return (target: object, propertyKey: string | symbol, paramIndex: number) => {
    const params =
      Reflect.getMetadata(KEY_SUBSCRIBER_PARAMS, target[propertyKey]) || [];
    params.push({
      index: paramIndex,
      ...parameter,
    });
    Reflect.defineMetadata(KEY_SUBSCRIBER_PARAMS, params, target[propertyKey]);
  };
}

/**
 * Decorator to specify a parameter representing the MQTT topic.
 * @constructor
 */
export function Topic() {
  return SetParameter({
    type: 'topic',
  });
}

/**
 * Decorator to specify a parameter representing the MQTT payload.
 * @param transform
 * @constructor
 */
export function Payload(
  transform?: 'json' | 'text' | MqttMessageTransformer<unknown>,
) {
  return SetParameter({
    type: 'payload',
    transform,
  });
}

/**
 * Decorator to specify a parameter representing the MQTT client.
 * @constructor
 */
export function Client(
  transform?: 'json' | 'text' | MqttMessageTransformer<unknown>,
) {
  return SetParameter({
    type: 'client',
    transform,
  });
}

/**
 * Take an array as parameter of a topic with wildcard.
 * Such like topic: foo/+/bar/+, you will get an array like:
 * ['first', 'second']
 */
export function Packet() {
  return SetParameter({
    type: 'packet',
  });
}

/**
 * Decorator to specify a parameter representing a subscription.
 * @constructor
 */
export function Subscription() {
  return SetParameter({
    type: 'subscription',
  });
}

/**
 * Decorator to specify a parameter representing an array of subscriptions.
 * @constructor
 */
export function Subscriptions() {
  return SetParameter({
    type: 'subscriptions',
  });
}

/**
 * Decorator to specify a parameter representing an unsubscription.
 * @constructor
 */
export function Unsubscription() {
  return SetParameter({
    type: 'unsubscription',
  });
}

/**
 * Decorator to specify a parameter representing a function.
 * @constructor
 */
export function Function() {
  return SetParameter({
    type: 'function',
  });
}

/**
 * Decorator to specify a parameter representing credentials.
 * @constructor
 */
export function Credential() {
  return SetParameter({
    type: 'credential',
  });
}

/**
 * Decorator to specify a parameter representing a host.
 * @constructor
 */
export function Host() {
  return SetParameter({
    type: 'host',
  });
}

/**
 * Decorator to specify a parameter representing an error.
 * @constructor
 */
export function Error() {
  return SetParameter({
    type: 'error',
  });
}
