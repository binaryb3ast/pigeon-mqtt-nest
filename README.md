<p align="center">
    <img src="images/logo.jpg" width="500" height="250" alt="Nest Mqtt Server Logo" />
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

[circleci-url]: https://circleci.com/gh/nestjs/nest

[![npm version](https://badge.fury.io/js/pigeon-mqtt-nest.svg)](https://badge.fury.io/js/pigeon-mqtt-nest)
[![npm download](https://img.shields.io/npm/dw/pigeon-mqtt-nest)](https://img.shields.io/npm/dw/pigeon-mqtt-nest)
[![npm lisence](https://img.shields.io/npm/l/pigeon-mqtt-nest)](https://img.shields.io/npm/l/pigeon-mqtt-nest)
[![github star](https://img.shields.io/github/stars/behnamnasehi/pigeon-mqtt-nestjs?style=social)](https://img.shields.io/github/stars/behnamnasehi/pigeon-mqtt-nestjs?style=social)
[![github fork](https://img.shields.io/github/forks/behnamnasehi/pigeon-mqtt-nestjs?style=social)](https://img.shields.io/github/forks/behnamnasehi/pigeon-mqtt-nestjs?style=social)

  <p align="center"> Nest.js MQTT broker that can run on any stream server</p>

# Topics

- [What is MQTT ?](#what-is-mqtt)
- [Installation](#installation)
- [Usage](#usage)
- [Handlers](#handlers)
- [Events](#events)
- [Methods](#methods)
- [Packets](#packets)
- [Middleware & Plugins](#middleware-plugins)
- [Dependencies](#dependencies)
- [Stay in touch](#stay-in-touch)
- [License](#license)
- [Example](src/test.ts)

# What is MQTT ?

MQTT is a lightweight IoT messaging protocol based on the publish/subscribe model. It can provide real-time and reliable
messaging services for networked devices with very little code and bandwidth. It is widely used in the industries such
as the IoT, mobile Internet, smart hardware, Internet of Vehicles and power energy.

MQTT (Message Queuing Telemetry Transport) is an open source, lightweight messaging protocol, optimized for low latency.
This protocol provides a callable and cost-efficient way to connect devices using a publish/subscribe model. A
communication system built on MQTT consists of the publishing server, a broker and one or more clients. It is designed
for constrained devices and low-bandwidth, high-latency or unreliable networks.

# Installation

Install From [NPM](https://www.npmjs.com/package/pigeon-mqtt-nest) :

```bash
$ npm i pigeon-mqtt-nest
```

[![https://nodei.co/npm/pigeon-mqtt-nest.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/pigeon-mqtt-nest.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/pigeon-mqtt-nest)

 - - - -

# Usage

[Pigeon-Mqtt-Nestjs](https://github.com/behnamnasehi/pigeon-mqtt-nest) will register as a global module. You can
import with configuration

```typescript
@Module({
  imports: [

    PigeonModule.forRoot({
      port: 1884,
      id: "binarybeast",
      concurrency:100,
      queueLimit:42,
      maxClientsIdLength:23,
      connectTimeout:30000,
      heartbeatInterval:60000,
     })

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
```

- options `<object>`
  - `mq` [`<MQEmitter>`](#mqemitter) middleware used to deliver messages to subscribed clients. In a cluster environment it is used also to share messages between brokers instances. __Default__: `mqemitter`
  - `concurrency` `<number>` maximum number of concurrent messages delivered by `mq`. __Default__: `100`
  - `persistence` [`<Persistence>`](#persistence) middleware that stores _QoS > 0, retained, will_ packets and _subscriptions_. __Default__: `aedes-persistence` (_in memory_)
  - `queueLimit` `<number>` maximum number of queued messages before client session is established. If number of queued items exceeds, `connectionError` throws an error `Client queue limit reached`. __Default__: `42`
  - `maxClientsIdLength` option to override MQTT 3.1.0 clients Id length limit. __Default__: `23`
  - `heartbeatInterval` `<number>` an interval in millisconds at which server beats its health signal in `$SYS/<aedes.id>/heartbeat` topic. __Default__: `60000`
  - `id` `<string>` aedes broker unique identifier. __Default__: `uuidv4()`
  - `connectTimeout` `<number>` maximum waiting time in milliseconds waiting for a [`CONNECT`][CONNECT] packet. __Default__: `30000`
- Returns `<Aedes>`

# Handlers

| Handler  | Emitted When |
| ------------- | ------------- |
| [preConnect](#handler-preconnect)  | Invoked when server receives a valid [`CONNECT`][CONNECT] packet.  |
| [authenticate](#handler-authenticate)  | Invoked after `preConnect`.  |
| [authorizePublish](#handler-authorizepublish)  | publish LWT to all online clients,incoming client publish  |
| [authorizeSubscribe](#handler-authorizesubscribe)  | restore subscriptions in non-clean session.,incoming client [`SUBSCRIBE`][SUBSCRIBE]  |
| [published](#handler-published)  | same as [`Event: publish`](#event-publish), but provides a backpressure functionality.  |

## Handler: preConnect

- client: [`<Client>`](./Client.md)
- packet: `<object>` [`CONNECT`][CONNECT]
- callback: `<Function>` `(error, successful) => void`
    - error `<Error>` | `null`
    - successful `<boolean>`

Invoked when server receives a valid [`CONNECT`][CONNECT] packet. The packet can be modified.

`client` object is in default state. If invoked `callback` with no errors and `successful` be `true`, server will
continue to establish a session.

Any `error` will be raised in `connectionError` event.

Some Use Cases:

1. Rate Limit / Throttle by `client.conn.remoteAddress`
2. Check `aedes.connectedClient` to limit maximum connections
3. IP blacklisting

```typescript
@Injectable()
export class TestService {

  @onPreConnect()
  onPreConnect(@Client() client, @Packet() packet, @Function() done) {
    console.log("Function: @onPreConnect()");
    return done(null, true);
  }

}
```

## Handler: authenticate

- client: [`<Client>`](./Client.md)
- credential: `<string>`
- callback: `<Function>` `(error, successful) => void`
    - error `<Error>` | `null`
    - successful `<boolean>`

Invoked after `preConnect`.

Server parses the [`CONNECT`][CONNECT] packet, initializes `client` object which set `client.id` to match the one
in [`CONNECT`][CONNECT] packet and extract `username` and `password` as parameters for user-defined authentication flow.

If invoked `callback` with no errors and `successful` be `true`, server authenticates `client` and continues to setup
the client session.

If authenticated, server acknowledges a [`CONNACK`][CONNACK] with `returnCode=0`, otherwise `returnCode=5`. Users could
define the value between `2` and `5` by defining a `returnCode` property in `error` object.

```typescript
@Injectable()
export class TestService {

  @onAuthenticate()
  onAuthenticate(@Client() client, @Credential() credential, @Function() done) {
    console.log("Function: @onAuthenticate()");
    return done(null, true);
  }

}
```

```typescript
@Injectable()
export class TestService {

  @onAuthenticate()
  onAuthenticate(@Client() client, @Credential() credential, @Function() done) {
    console.log("Function: @onAuthenticate()");
    var error = new Error('Auth error')
    error.returnCode = 4
    return done(error, false);
  }

}
```

Please refer to [Connect Return Code](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Table_3.1_-)
to see their meanings.

## Handler: authorizePublish

- client: [`<Client>`](./Client.md) | `null`
- packet: `<object>` [`PUBLISH`][PUBLISH]
- callback: `<Function>` `(error) => void`
    - error `<Error>` | `null`

Invoked when

1. publish LWT to all online clients
2. incoming client publish

`client` is `null` when aedes publishes obsolete LWT without connected clients

If invoked `callback` with no errors, server authorizes the packet otherwise emits `clientError` with `error`. If
an `error` occurs the client connection will be closed, but no error is returned to the client (MQTT-3.3.5-2)

```typescript
@Injectable()
export class TestService {

  @onAuthorizePublish()
  onAuthorizePublish(@Client() client, @Packet() packet, @Function() done) {
    console.log("Function: @onAuthorizePublish()");
    if (packet.topic === 'aaaa') {
      return done(new Error('wrong topic'))
    }
    if (packet.topic === 'bbb') {
      packet.payload = Buffer.from('overwrite packet payload')
    }
    return done(null);
  }

}
```

By default `authorizePublish` throws error in case a client publish to topics with `$SYS/` prefix to prevent possible
DoS (see [#597](https://github.com/moscajs/aedes/issues/597)). If you write your own implementation
of `authorizePublish` we suggest you to add a check for this. Default implementation:

```typescript
@Injectable()
export class TestService {

  @onAuthorizePublish()
  onAuthorizePublish(@Client() client, @Packet() packet, @Function() done) {
    if (packet.topic.startsWith($SYS_PREFIX)) {
      return done(new Error($SYS_PREFIX + ' topic is reserved'))
    }
    return done(null);
  }

}
```

## Handler: authorizeSubscribe

- client: [`<Client>`](./Client.md)
- subscription: `<object>`
- callback: `<Function>` `(error) => void`
    - error `<Error>` | `null`
    - subscription: `<object>` | `null`

Invoked when

1. restore subscriptions in non-clean session.
2. incoming client [`SUBSCRIBE`][SUBSCRIBE]

`subscription` is a dictionary object like `{ topic: hello, qos: 0 }`.

If invoked `callback` with no errors, server authorizes the packet otherwise emits `clientError` with `error`.

In general user should not touch the `subscription` and pass to callback, but server gives an option to change the
subscription on-the-fly.

```typescript
@Injectable()
export class TestService {

  @onAuthorizeSubscribe()
  onAuthorizeSubscribe(@Client() client, @Subscription() subscription, @Function() done) {
    console.log("Function: @onAuthorizeSubscribe()");
    if (subscription.topic === 'aaaa') {
      return done(new Error('wrong topic'))
    }
    if (subscription.topic === 'bbb') {
      // overwrites subscription
      subscription.topic = 'foo'
      subscription.qos = 1
    }
    return done(null, subscription);
  }

}
```

To negate a subscription, set the subscription to `null`. Aedes ignores the negated subscription and the `qos`
in `SubAck` is set to `128` based
on [MQTT 3.11 spec](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.html#_Toc385349323):

```typescript
@Injectable()
export class TestService {

  @onAuthorizeSubscribe()
  onAuthorizeSubscribe(@Client() client, @Subscription() subscription, @Function() done) {
    done(null, subscription.topic === 'aaaa' ? null : sub)
  }

}
```

## Handler: published

- packet: `<aedes-packet>` & [`PUBLISH`][PUBLISH]
- client: [`<Client>`](./Client.md)
- callback: `<Function>`

same as [`Event: publish`](#event-publish), but provides a backpressure functionality. TLDR; If you are doing operations
on packets that MUST require finishing operations on a packet before handling the next one use this otherwise,
especially for long-running operations, you should use [`Event: publish`](#event-publish) instead.

```typescript
@Injectable()
export class TestService {

  @onPublish()
  OnPublish(@Topic() topic, @Packet() packet, @Payload() payload, @Client() client) {
    console.log("Function: @OnPublish()");
  }

}
```

[CONNECT]: https://github.com/mqttjs/mqtt-packet#connect

[CONNACK]: https://github.com/mqttjs/mqtt-packet#connack

[SUBSCRIBE]: https://github.com/mqttjs/mqtt-packet#subscribe

[PINGREQ]: https://github.com/mqttjs/mqtt-packet#pingreq

[PUBLISH]: https://github.com/mqttjs/mqtt-packet#publish

[PUBREL]: https://github.com/mqttjs/mqtt-packet#pubrel

# Events

| Name  | Emitted When |
| ------------- | ------------- |
| [Client](#event-client)  | `client` registers itself to `server`  |
| [Client Ready](#event-clientready)  | `client` has received all its offline messages and be initialized.  |
| [Client Disconnect](#event-clientdisconnect)  | `client` disconnects.  |
| [Client Error](#event-clienterror)  | an error occurs.  |
| [Connection Error](#event-connectionerror)  | an error occurs.  |
| [Keep Alive Timeout](#event-keepalivetimeout)  | timeout happes in the `client` keepalive.  |
| [Publish](#event-publish)  | `servers` delivers the `packet` to subscribed `client`.  |
| [Ack](#event-ack)  | `packet` successfully delivered to the `client`.  |
| [Subscribe](#event-subscribe)  | `client` successfully subscribe the `subscriptions` in server. |
| [Unsubscribe](#event-unsubscribe)  | `client` successfully unsubscribe the `subscriptions` in server.  |
| [Connack Sent](#event-connacksent)  |`server` sends an acknowledge to `client`.  |
| [Closed](#event-closed)  | `server` is closed.  |

## Event: client

- `client` [`<Client>`](./Client.md)

Emitted when the `client` registers itself to server. The `client` is not ready yet.
Its [`connecting`](./Client.md##clientconnecting) state equals to `true`.

Server publishes a SYS topic `$SYS/<aedes.id>/new/clients` to inform it registers the client into its registration
pool. `client.id` is the payload.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onClient()
  OnNewClient(@Client() client) {
    console.log("Function: @onClient()");
  }

}
```

## Event: clientReady

- `client` [`<Client>`](./Client.md)

Emitted when the `client` has received all its offline messages and be initialized.
The `client` [`connected`](./Client.md##clientconnected) state equals to `true` and is ready for processing incoming
messages.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onClientReady()
  async onClientReady(@Client() client) {
    console.log("Function: @onClientReady()");
  }

}
```

## Event: clientDisconnect

- `client` [`<Client>`](./Client.md)

Emitted when a client disconnects.

Server publishes a SYS topic `$SYS/<aedes.id>/disconnect/clients` to inform it deregisters the client. `client.id` is
the payload.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onClientDisconnect()
  OnClientDisconnect(@Client() client) {
    console.log("Function: @OnClientDisconnect()");
  }

}
```

## Event: clientError

- `client` [`<Client>`](./Client.md)
- `error` `<Error>`

Emitted when an error occurs.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onClientError()
  OnClientError(@Client() client, @Error() error) {
    console.log("Function: @onClientError()");
  }

}
```

## Event: connectionError

- `client` [`<Client>`](./Client.md)
- `error` `<Error>`

Emitted when an error occurs. Unlike `clientError` it raises only when `client` is uninitialized.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onConnectionError()
  OnConnectionError(@Client() client, @Error() error) {
    console.log("Function: @OnConnectionError()");
  }

}
```

## Event: keepaliveTimeout

- `client` [`<Client>`](./Client.md)

Emitted when timeout happes in the `client` keepalive.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onKeepLiveTimeout()
  onKeepLiveTimeout(@Client() client) {
    console.log("Function: @onKeepLiveTimeout()");
  }

}
```

## Event: publish

- `packet` `<aedes-packet>` & [`PUBLISH`][PUBLISH]
- `client` [`<Client>`](./Client.md) | `null`

Emitted when servers delivers the `packet` to subscribed `client`. If there are no clients subscribed to the `packet`
topic, server still publish the `packet` and emit the event. `client` is `null` when `packet` is an internal message
like aedes heartbeat message and LWT.

> _Note! `packet` belongs `aedes-packet` type. Some properties belongs to aedes internal, any changes on them will break aedes internal flow._

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onPublish()
  OnPublish(@Topic() topic, @Packet() packet, @Payload() payload, @Client() client) {
    console.log("Function: @OnPublish()");
  }

}
```

## Event: ack

- `packet` `<object>` [`PUBLISH`][PUBLISH] for QoS 1, [`PUBREL`][PUBREL] for QoS 2
- `client` [`<Client>`](./Client.md)

Emitted an QoS 1 or 2 acknowledgement when the `packet` successfully delivered to the `client`.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }


  @onAck()
  onAck(@Client() client, @Packet() packet) {
    console.log("Function: @onAck()");
  }

}
```

## Event: subscribe

- `subscriptions` `<object>`
- `client` [`<Client>`](./Client.md)

Emitted when `client` successfully subscribe the `subscriptions` in server.

`subscriptions` is an array of `{ topic: topic, qos: qos }`. The array excludes duplicated topics and includes negated
subscriptions where `qos` equals to `128`. See more
on [authorizeSubscribe](#handler-authorizesubscribe-client-subscription-callback)

Server publishes a SYS topic `$SYS/<aedes.id>/new/subscribers` to inform a client successfully subscribed to one or more
topics. The payload is a JSON that has `clientId` and `subs` props, `subs` equals to `subscriptions` array.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onSubscribe()
  OnSubscribe(@Subscription() subscription, @Client() client) {
    console.log("Function: @OnSubscribe()");
  }

}
```

## Event: unsubscribe

- `unsubscriptions` `Array<string>`
- `client` [`<Client>`](./Client.md)

Emitted when `client` successfully unsubscribe the `subscriptions` in server.

`unsubscriptions` are an array of unsubscribed topics.

Server publishes a SYS topic `$SYS/<aedes.id>/new/unsubscribers` to inform a client successfully unsubscribed to one or
more topics. The payload is a JSON that has `clientId` and `subs` props, `subs` equals to `unsubscriptions` array.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onUnsubscribe()
  OnUnsubscribe(@Subscription() subscription, @Client() client) {
    console.log("Function: @OnUnsubscribe()");
  }

}
```

## Event: connackSent

- `packet` `<object>` [`CONNACK`][CONNACK]
- `client` [`<Client>`](./Client.md)

Emitted when server sends an acknowledge to `client`. Please refer to the MQTT specification for the explanation of
returnCode object property in `CONNACK`.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onConnackSent()
  onConnackSent(@Client() client, @Packet() packet) {
    console.log("Function: @onConnackSent()");
  }

}
```

## Event: closed

Emitted when server is closed.

```typescript
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly aedesService: PigeonService) {
  }

  @onClosed()
  onClosed(@Client() client, @Packet() packet) {
    console.log("Function: @onClosed()");
  }

}
```

# Methods

| Method  | Emitted When |
| ------------- | ------------- |
| [Publish](#method-publish)  | Directly deliver `packet` on behalf of server to subscribed clients.  |
| [Close](#method-close)  | Close aedes server and disconnects all clients.  |

## Method: Publish

- `packet` `<object>` [`PUBLISH`][PUBLISH]

Directly deliver `packet` on behalf of server to subscribed clients.
Bypass [`authorizePublish`](#handler-authorizepublish-client-packet-callback).

`callback` will be invoked with `error` arugments after finish.

```typescript
@Injectable()
export class TestService {

  //inject Pigeon Service
  constructor(@Inject(PigeonService) private readonly pigeonService: PigeonService) {
  }

  @onPublish()
  async OnPublish(@Topic() topic, @Packet() packet, @Payload() payload, @Client() client) {

    //use this method to publish
    await this.pigeonService.publish({
      topic: "test2", qos: 0, cmd: "publish", payload: "", dup: false, retain: false
    });

  }

}
```

## Method: Close

- callback: `<Function>`

Close aedes server and disconnects all clients.

`callback` will be invoked when server is closed.

```typescript
@Injectable()
export class TestService {

  //inject Pigeon Service
  constructor(@Inject(PigeonService) private readonly pigeonService: PigeonService) {
  }

  @onPublish()
  async OnPublish(@Topic() topic, @Packet() packet, @Payload() payload, @Client() client) {

    //use this method to publish
    await this.pigeonService.close();

  }

}
```

# Packets
This section describes the format of all packets

| Packet  | - |
| ------------- | ------------- |
| [Connect](#packet-connect)  | ---  |
| [Connack](#packet-connack)  | ---  |
| [Subscribe](#packet-subscribe)  | ---  |
| [Suback](#packet-suback)  | ---  |
| [Unsubscribe](#packet-unsubscribe)  | ---  |
| [Unsuback](#packet-unsuback)  | ---  |
| [Publish](#packet-publish)  | ---  |
| [Puback](#packet-puback)  | ---  |
| [Pubrec](#packet-pubrec)  | ---  |
| [Pubrel](#packet-pubrel)  | ---  |
| [Pubcomp](#packet-pubcomp)  | ---  |
| [Pingreq](#packet-pingreq)  | ---  |
| [Pingresp](#packet-pingresp)  | ---  |
| [Disconnect](#packet-disconnect)  | ---  |

## Packet: Connect
```js
{
  cmd: 'connect',
  protocolId: 'MQTT', // Or 'MQIsdp' in MQTT 3.1 and 5.0
  protocolVersion: 4, // Or 3 in MQTT 3.1, or 5 in MQTT 5.0
  clean: true, // Can also be false
  clientId: 'my-device',
  keepalive: 0, // Seconds which can be any positive number, with 0 as the default setting
  username: 'matteo',
  password: Buffer.from('collina'), // Passwords are buffers
  will: {
    topic: 'mydevice/status',
    payload: Buffer.from('dead'), // Payloads are buffers
    properties: { // MQTT 5.0
      willDelayInterval: 1234,
      payloadFormatIndicator: false,
      messageExpiryInterval: 4321,
      contentType: 'test',
      responseTopic: 'topic',
      correlationData: Buffer.from([1, 2, 3, 4]),
      userProperties: {
        'test': 'test'
      }
    }
  },
  properties: { // MQTT 5.0 properties
      sessionExpiryInterval: 1234,
      receiveMaximum: 432,
      maximumPacketSize: 100,
      topicAliasMaximum: 456,
      requestResponseInformation: true,
      requestProblemInformation: true,
      userProperties: {
        'test': 'test'
      },
      authenticationMethod: 'test',
      authenticationData: Buffer.from([1, 2, 3, 4])
  }
}
```
 
If `password` or `will.payload` are passed as strings, they will automatically be converted into a `Buffer`.

## Packet: Connack
```js
{
  cmd: 'connack',
  returnCode: 0, // Or whatever else you see fit MQTT < 5.0
  sessionPresent: false, // Can also be true.
  reasonCode: 0, // reason code MQTT 5.0
  properties: { // MQTT 5.0 properties
      sessionExpiryInterval: 1234,
      receiveMaximum: 432,
      maximumQoS: 2,
      retainAvailable: true,
      maximumPacketSize: 100,
      assignedClientIdentifier: 'test',
      topicAliasMaximum: 456,
      reasonString: 'test',
      userProperties: {
        'test': 'test'
      },
      wildcardSubscriptionAvailable: true,
      subscriptionIdentifiersAvailable: true,
      sharedSubscriptionAvailable: false,
      serverKeepAlive: 1234,
      responseInformation: 'test',
      serverReference: 'test',
      authenticationMethod: 'test',
      authenticationData: Buffer.from([1, 2, 3, 4])
  }
}
```

## Packet: Subscribe
```js
{
  cmd: 'subscribe',
  messageId: 42,
  properties: { // MQTT 5.0 properties
    subscriptionIdentifier: 145,
    userProperties: {
      test: 'test'
    }
  }
  subscriptions: [{
    topic: 'test',
    qos: 0,
    nl: false, // no Local MQTT 5.0 flag
    rap: true, // Retain as Published MQTT 5.0 flag
    rh: 1 // Retain Handling MQTT 5.0
  }]
}
```

## Packet: Suback
```js
{
  cmd: 'suback',
  messageId: 42,
  properties: { // MQTT 5.0 properties
    reasonString: 'test',
    userProperties: {
      'test': 'test'
    }
  }
  granted: [0, 1, 2, 128]
}
```

## Packet: Unsubscribe
```js
{
  cmd: 'unsubscribe',
  messageId: 42,
  properties: { // MQTT 5.0 properties
    userProperties: {
      'test': 'test'
    }
  }
  unsubscriptions: [
    'test',
    'a/topic'
  ]
}
```

## Packet: Unsuback
```js
{
  cmd: 'unsuback',
  messageId: 42,
  properties: { // MQTT 5.0 properties
    reasonString: 'test',
    userProperties: {
      'test': 'test'
    }
  }
}
```

## Packet: Publish
```js
{
  cmd: 'publish',
          messageId: 42,
          qos: 2,
          dup: false,
          topic: 'test',
          payload: Buffer.from('test'),
          retain: false,
          properties: { // optional properties MQTT 5.0
    payloadFormatIndicator: true,
            messageExpiryInterval: 4321,
            topicAlias: 100,
            responseTopic: 'topic',
            correlationData: Buffer.from([1, 2, 3, 4]),
            userProperties: {
      'test': 'test'
    },
    subscriptionIdentifier: 120, // can be an Array in message from broker, if message included in few another subscriptions
            contentType: 'test'
  }
}
```

## Packet: Puback
```js
{
  cmd: 'puback',
          messageId: 42,
          reasonCode: 16, // only for MQTT 5.0
          properties: { // MQTT 5.0 properties
    reasonString: 'test',
            userProperties: {
      'test': 'test'
    }
  }
}
```

## Packet: Pubrec
```js
{
  cmd: 'pubrec',
          messageId: 42,
          reasonCode: 16, // only for MQTT 5.0
          properties: { // properties MQTT 5.0
    reasonString: 'test',
            userProperties: {
      'test': 'test'
    }
  }
}
```

## Packet: Pubrel
```js
{
  cmd: 'pubrel',
          messageId: 42,
          reasonCode: 16, // only for MQTT 5.0
          properties: { // properties MQTT 5.0
    reasonString: 'test',
            userProperties: {
      'test': 'test'
    }
  }
}
```

## Packet: Pubcomp
```js
{
  cmd: 'pubcomp',
          messageId: 42,
          reasonCode: 16, // only for MQTT 5.0
          properties: { // properties MQTT 5.0
    reasonString: 'test',
            userProperties: {
      'test': 'test'
    }
  }
}
```

## Packet: Pingreq
```js
{
  cmd: 'pingreq'
}
```

## Packet: Pingresp
```js
{
  cmd: 'pingresp'
}
```

## Packet: Disconnect
```js
{
  cmd: 'disconnect',
          reasonCode: 0, // MQTT 5.0 code
          properties: { // properties MQTT 5.0
    sessionExpiryInterval: 145,
            reasonString: 'test',
            userProperties: {
      'test': 'test'
    },
    serverReference: 'test'
  }
}
```

# Middleware Plugins

## Persistence

- [aedes-persistence]: In-memory implementation of an Aedes persistence
- [aedes-persistence-mongodb]: MongoDB persistence for Aedes
- [aedes-persistence-redis]: Redis persistence for Aedes
- [aedes-persistence-level]: LevelDB persistence for Aedes
- [aedes-persistence-nedb]: NeDB persistence for Aedes

## MQEmitter

- [mqemitter]: An opinionated memory Message Queue with an emitter-style API
- [mqemitter-redis]: Redis-powered mqemitter
- [mqemitter-mongodb]: Mongodb based mqemitter
- [mqemitter-child-process]: Share the same mqemitter between a hierarchy of
  child processes
- [mqemitter-cs]: Expose a MQEmitter via a simple client/server protocol
- [mqemitter-p2p]: A P2P implementation of MQEmitter, based on HyperEmitter and
  a Merkle DAG
- [mqemitter-aerospike]: Aerospike mqemitter

# Dependencies

* [aedes](https://www.npmjs.com/package/aedes)
* [aedes-server-factory](https://www.npmjs.com/package/aedes-server-factory)

 - - - -

# Stay in touch

- Author Twitter - [@binarybeast](https://twitter.com/binarybeastt)

 - - - -

# License

```text
MIT License

Copyright (c) 2021 behnamnasehi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


[GO TO TOP](#topics)

