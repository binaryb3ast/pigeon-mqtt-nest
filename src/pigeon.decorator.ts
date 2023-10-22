import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { KEY_SUBSCRIBE_OPTIONS, KEY_SUBSCRIBER_PARAMS } from 'pigeon.constant';
import {
  MqttMessageTransformer,
  MqttSubscribeOptions,
  MqttSubscriberParameter,
} from 'pigeon.interface';
import { SystemTopics } from 'enum/pigeon.topic.enum';

export function ListenOn(
  topic: string | string[] | RegExp | RegExp[] | MqttSubscribeOptions,
): CustomDecorator;
export function ListenOn(topicOrOptions): CustomDecorator {
  if (typeof topicOrOptions === 'string' || Array.isArray(topicOrOptions)) {
    return SetMetadata(KEY_SUBSCRIBE_OPTIONS, topicOrOptions);
  } else {
    return SetMetadata(KEY_SUBSCRIBE_OPTIONS, topicOrOptions);
  }
}

export function onHeartBeat(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.HEART_BEAT);
}

export function onPublish(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.PUBLISH);
}

export function onClientReady(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT_READY);
}

export function onClient(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT);
}

export function onClientDisconnect(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT_DISCONNECT);
}

export function onClientError(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLIENT_ERROR);
}

export function onSubscribe(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.SUBSCRIBES);
}

export function onUnsubscribe(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.UNSUBSCRIBES);
}

export function onAuthenticate(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHENTICATE);
}

export function onPreConnect(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.PRE_CONNECT);
}

export function onAuthorizePublish(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHORIZE_PUBLISH);
}

export function onAuthorizeSubscribe(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHORIZE_SUBSCRIBE);
}

export function onAuthorizeForward(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.AUTHORIZE_FORWARD);
}

export function onPublished(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.PUBLISHED);
}

export function onKeepLiveTimeout(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.KEEP_LIVE_TIMEOUT);
}

export function onAck(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.ACK);
}

export function onConnackSent(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CONNACK_SENT);
}

export function onClosed(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CLOSED);
}

export function onConnectionError(): CustomDecorator {
  return SetMetadata(KEY_SUBSCRIBE_OPTIONS, SystemTopics.CONNECTION_ERROR);
}

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
 * Take the topic in parameters.
 * @constructor
 */
export function Topic() {
  return SetParameter({
    type: 'topic',
  });
}

/**
 * Take the payload in parameters.
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

export function Subscription() {
  return SetParameter({
    type: 'subscription',
  });
}

export function Subscriptions() {
  return SetParameter({
    type: 'subscriptions',
  });
}

export function Unsubscription() {
  return SetParameter({
    type: 'unsubscription',
  });
}

export function Function() {
  return SetParameter({
    type: 'function',
  });
}

export function Credential() {
  return SetParameter({
    type: 'credential',
  });
}

export function Host() {
  return SetParameter({
    type: 'host',
  });
}

export function Error() {
  return SetParameter({
    type: 'error',
  });
}
