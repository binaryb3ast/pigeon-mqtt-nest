<p align="center">
  <h1 align="center">🕊️ Pigeon MQTT</h1>
  <p align="center">
    <strong>Embed a full MQTT broker inside your NestJS application.</strong><br/>
    Zero external services. Decorator-driven. Production-ready.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/pigeon-mqtt-nest"><img src="https://img.shields.io/npm/v/pigeon-mqtt-nest?style=for-the-badge&logo=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/pigeon-mqtt-nest"><img src="https://img.shields.io/npm/dm/pigeon-mqtt-nest?style=for-the-badge&logo=npm" alt="npm downloads" /></a>
  <a href="https://github.com/binaryb3ast/pigeon-mqtt-nest/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/pigeon-mqtt-nest?style=for-the-badge" alt="license" /></a>
  <a href="https://github.com/binaryb3ast/pigeon-mqtt-nest"><img src="https://img.shields.io/github/stars/binaryb3ast/pigeon-mqtt-nest?style=for-the-badge&logo=github" alt="github stars" /></a>
</p>

---

## Why Pigeon?

Most NestJS MQTT solutions require an **external broker** (Mosquitto, EMQX, HiveMQ) running as a separate process. Pigeon takes a different approach — it embeds [Aedes](https://github.com/moscajs/aedes), a pure JavaScript MQTT broker, directly into your NestJS application.

**What this means for you:**
- 🚀 **One process** — no broker to deploy, monitor, or scale separately
- 🎯 **Decorator-driven** — handle messages with `@Subscribe('topic')` instead of wiring callbacks
- 🔄 **Full MQTT 3.1.1** support — QoS 0/1/2, retained messages, will messages, wildcards
- ⚡ **O(1) topic dispatch** — pre-computed topic handler map, no linear scans at runtime
- 🧩 **NestJS-native** — dependency injection, async config, module lifecycle integration

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Handling Messages](#handling-messages)
  - [Subscribe to a Topic](#subscribe-to-a-topic)
  - [Wildcards & Patterns](#wildcards--patterns)
  - [Parameter Injection](#parameter-injection)
- [Handler Decorators](#handler-decorators)
  - [preConnect](#preconnect)
  - [authenticate](#authenticate)
  - [authorizePublish](#authorizepublish)
  - [authorizeSubscribe](#authorizesubscribe)
- [Events](#events)
- [Publishing Messages](#publishing-messages)
- [Persistence & Clustering](#persistence--clustering)
- [API Reference](#api-reference)
- [License](#license)

---

## Quick Start

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { PigeonModule, Transport } from 'pigeon-mqtt-nest';

@Module({
  imports: [
    PigeonModule.forRoot({
      port: 1883,
      transport: Transport.TCP,
    }),
  ],
})
export class AppModule {}
```

```typescript
// device.controller.ts
import { Injectable } from '@nestjs/common';
import { Subscribe, Payload, Topic } from 'pigeon-mqtt-nest';

@Injectable()
export class DeviceController {

  @Subscribe('devices/+/telemetry')
  onTelemetry(@Topic() topic: string, @Payload('json') payload: any) {
    const deviceId = topic.split('/')[1];
    console.log(`Telemetry from ${deviceId}:`, payload);
  }

  @Subscribe('devices/#')
  onAllDevices(@Topic() topic: string, @Payload('text') payload: string) {
    console.log(`[${topic}] ${payload}`);
  }
}
```

That's it. Your NestJS app is now an MQTT broker listening on port 1883. Any MQTT client can connect and publish to `devices/my-sensor/telemetry` — your handler fires automatically.

---

## Installation

```bash
npm install pigeon-mqtt-nest
```

**Peer dependencies** (you likely already have these):
- `@nestjs/common ^11`
- `@nestjs/core ^11`
- `rxjs ^7`

---

## Configuration

### Synchronous

```typescript
PigeonModule.forRoot({
  port: 1883,                         // TCP port to listen on (required)
  transport: Transport.TCP,           // Transport.TCP or Transport.WS

  // --- Aedes broker options (all optional) ---
  id: 'my-broker',                    // Unique broker ID. Default: auto-generated UUID
  concurrency: 100,                   // Max concurrent QoS messages. Default: 100
  queueLimit: 42,                     // Max queued messages per client. Default: 42
  maxClientsIdLength: 23,             // Max client ID length. Default: 23
  connectTimeout: 30000,              // CONNECT packet timeout (ms). Default: 30000
  heartbeatInterval: 60000,           // Health signal interval (ms). Default: 60000
})
```

### Asynchronous (with ConfigService)

```typescript
PigeonModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    port: config.get<number>('MQTT_PORT', 1883),
    transport: Transport.TCP,
    id: config.get<string>('BROKER_ID', 'pigeon'),
  }),
})
```

### Configuration Defaults

| Option | Default | Description |
|--------|---------|-------------|
| `port` | *(required)* | TCP port for the MQTT server |
| `transport` | `Transport.TCP` | `TCP` or `WS` (WebSocket) |
| `id` | `uuid` | Unique broker identifier |
| `concurrency` | `100` | Max concurrent QoS 1/2 message deliveries |
| `queueLimit` | `42` | Max queued messages before client disconnect |
| `maxClientsIdLength` | `23` | MQTT 3.1 client ID length limit |
| `connectTimeout` | `30000` | Milliseconds to wait for CONNECT packet |
| `heartbeatInterval` | `60000` | Milliseconds between `$SYS` heartbeat publishes |
| `persistence` | in-memory | Persistence adapter (see [Persistence](#persistence--clustering)) |

> ⚠️ **Production note:** The default persistence is in-memory. Retained messages and QoS tracking state are never evicted and will grow unbounded over time. For production workloads, configure a persistent backend like `aedes-persistence-redis` or `aedes-persistence-level`.

---

## Handling Messages

### Subscribe to a Topic

Use the `@Subscribe()` decorator on any method in an `@Injectable()` class:

```typescript
import { Subscribe, Payload, Topic, Client } from 'pigeon-mqtt-nest';

@Injectable()
export class SensorHandler {

  @Subscribe('sensors/temperature')
  onTemperature(@Payload('json') data: { value: number }, @Client() client: any) {
    console.log(`Temperature: ${data.value}°C from client ${client.id}`);
  }
}
```

### Wildcards & Patterns

Pigeon supports MQTT wildcard subscriptions and segment-based patterns:

```typescript
// MQTT wildcards
@Subscribe('sensors/+/data')       // + matches one level
@Subscribe('sensors/#')            // # matches zero or more levels

// Segment patterns (path parameters)
@Subscribe('devices/:deviceId/logs/:logId')
onDeviceLog(
  @Payload('json') payload: any,
  // Extracted segments are available via Topic metadata
) {
  // topic matches: "devices/abc-123/logs/456"
}
```

### Parameter Injection

Decorate method parameters to receive specific parts of the MQTT message:

```typescript
@Subscribe('my/topic')
onMessage(
  @Payload('json') payload: any,        // Message payload (auto-parsed)
  @Payload('text') rawPayload: string,  // Raw string payload
  @Payload() bufferPayload: Buffer,     // Raw buffer payload
  @Topic() topic: string,               // Topic string
  @Client() client: any,                // MQTT client object
  @Packet() packet: any,                // Full MQTT packet
) {
  // Use what you need — unused parameters are ignored
}
```

**Payload transformers** — control how the payload is deserialized:

| Transformer | Description |
|-------------|-------------|
| `'json'` | Parses `Buffer` → `JSON.parse()` → object |
| `'text'` | Converts `Buffer` → UTF-8 string |
| *(default)* | Returns raw `Buffer` |

---

## Handler Decorators

These decorators hook into the Aedes broker's authentication and authorization pipeline. Place them on methods in `@Injectable()` services.

### preConnect

Called when the broker receives a valid CONNECT packet. Return `true` to allow, `false` or an `Error` to reject.

```typescript
@onPreConnect()
onPreConnect(@Client() client: any, @Packet() packet: any, @Function() done: Function) {
  // Rate limiting, IP blacklisting, connection limits
  return done(null, true);
}
```

### authenticate

Called after preConnect with the client's credentials. Return `true` to authenticate, or an `Error` with a `returnCode` (2–5) to reject.

```typescript
@onAuthenticate()
onAuthenticate(@Client() client: any, @Credential() credential: string, @Function() done: Function) {
  if (credential === 'valid-token') {
    return done(null, true);
  }
  const error = new Error('Unauthorized');
  error.returnCode = 4; // 4 = not authorized
  return done(error, false);
}
```

> See [MQTT Connect Return Codes](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Table_3.1_-) for the full list.

### authorizePublish

Called when a client publishes a message. Reject to prevent the publish.

```typescript
@onAuthorizePublish()
onAuthorizePublish(@Client() client: any, @Packet() packet: any, @Function() done: Function) {
  // Block publishing to $SYS topics
  if (packet.topic.startsWith('$SYS/')) {
    return done(new Error('$SYS/ topic is reserved'));
  }
  return done(null);
}
```

### authorizeSubscribe

Called when a client subscribes to a topic. Return the subscription to allow, `null` to deny, or a modified subscription to rewrite.

```typescript
@onAuthorizeSubscribe()
onAuthorizeSubscribe(@Client() client: any, @Subscription() subscription: any, @Function() done: Function) {
  // Deny subscription to a topic
  if (subscription.topic === 'forbidden-topic') {
    return done(null, null); // null = denied (qos 128 in SUBACK)
  }
  return done(null, subscription);
}
```

---

## Events

Subscribe to broker lifecycle events using the `@on*()` decorators:

```typescript
import {
  onClient, onClientReady, onClientDisconnect,
  onClientError, onConnectionError, onKeepLiveTimeout,
  onPublish, onAck, onSubscribe, onUnsubscribe,
  onConnackSent, onClosed,
} from 'pigeon-mqtt-nest';
```

| Decorator | Event | Parameters |
|-----------|-------|------------|
| `@onClient()` | New client connected (not ready yet) | `@Client() client` |
| `@onClientReady()` | Client fully initialized | `@Client() client` |
| `@onClientDisconnect()` | Client disconnected | `@Client() client` |
| `@onClientError()` | Client error | `@Client() client, @Error() error` |
| `@onConnectionError()` | Connection error (before auth) | `@Client() client, @Error() error` |
| `@onKeepLiveTimeout()` | Keepalive timeout | `@Client() client` |
| `@onPublish()` | Message published | `@Topic() topic, @Packet() packet, @Payload() payload, @Client() client` |
| `@onAck()` | QoS 1/2 acknowledgement | `@Client() client, @Packet() packet` |
| `@onSubscribe()` | Subscription created | `@Subscription() subscription, @Client() client` |
| `@onUnsubscribe()` | Subscription removed | `@Subscription() subscription, @Client() client` |
| `@onConnackSent()` | CONNACK sent to client | `@Client() client, @Packet() packet` |
| `@onClosed()` | Server closed | *(no parameters)* |

**Example — tracking connections:**

```typescript
@Injectable()
export class ConnectionTracker {

  @onClient()
  onConnect(@Client() client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  @onClientDisconnect()
  onDisconnect(@Client() client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @onClosed()
  onServerClosed() {
    console.log('MQTT server shut down');
  }
}
```

---

## Publishing Messages

Inject `PigeonService` to publish messages programmatically:

```typescript
import { Injectable } from '@nestjs/common';
import { PigeonService } from 'pigeon-mqtt-nest';

@Injectable()
export class NotificationService {

  constructor(private readonly pigeon: PigeonService) {}

  async notify(deviceId: string, message: string) {
    await this.pigeon.publish({
      topic: `devices/${deviceId}/notifications`,
      payload: Buffer.from(message),
      qos: 1,
      retain: false,
      cmd: 'publish',
      dup: false,
    });
  }

  async shutdown() {
    await this.pigeon.close(); // Gracefully close the broker
  }
}
```

---

## Persistence & Clustering

### Persistence Adapters

The default in-memory persistence is suitable for **development and testing only**. For production, choose a persistent backend:

| Adapter | Backend | Best For |
|---------|---------|----------|
| `aedes-persistence` | In-memory | Development, testing |
| `aedes-persistence-redis` | Redis | Production (recommended) |
| `aedes-persistence-level` | LevelDB | Embedded, single-node |
| `aedes-persistence-mongodb` | MongoDB | If already using Mongo |

**Using Redis persistence:**

```typescript
import Aedes from 'aedes';
import persistence from 'aedes-persistence-redis';

const redisPersistence = persistence({
  port: 6379,
  host: '127.0.0.1',
  family: 4,
});

PigeonModule.forRoot({
  port: 1883,
  persistence: redisPersistence,
})
```

### Message Queue (MQEmitter)

For clustering, replace the default in-memory `mqemitter` with a shared backend:

| Adapter | Backend |
|---------|---------|
| `mqemitter` | In-memory (default) |
| `mqemitter-redis` | Redis |
| `mqemitter-mongodb` | MongoDB |
| `mqemitter-cs` | Client/Server protocol |

---

## API Reference

### `PigeonModule`

| Method | Description |
|--------|-------------|
| `PigeonModule.forRoot(options)` | Register the MQTT module with synchronous config |
| `PigeonModule.forRootAsync(options)` | Register with async/dynamic config |

### `PigeonService`

| Method | Returns | Description |
|--------|---------|-------------|
| `publish(packet)` | `Promise<void>` | Publish a message to all matching subscribers |
| `close()` | `Promise<string>` | Close the broker and disconnect all clients |
| `getBrokerInstance()` | `Aedes` | Access the underlying Aedes broker |

### Decorators

**Subscription decorator:**
| Decorator | Usage |
|-----------|-------|
| `@Subscribe(topic)` | Subscribe to a topic (string, string[], RegExp, or segment pattern) |

**Parameter decorators:**
| Decorator | Available On | Description |
|-----------|-------------|-------------|
| `@Payload(transform?)` | `@Subscribe`, `@onPublish` | Message payload |
| `@Topic()` | `@Subscribe`, `@onPublish` | Topic string |
| `@Client()` | All handlers/events | MQTT client object |
| `@Packet()` | All handlers/events | Full MQTT packet |
| `@Credential()` | `@onAuthenticate` | Client credential |
| `@Subscription()` | `@onSubscribe`, `@onUnsubscribe`, `@onAuthorizeSubscribe` | Subscription info |
| `@Subscriptions()` | `@onSubscribe` | All subscriptions |
| `@Unsubscription()` | `@onUnsubscribe` | Unsubscription info |
| `@Error()` | `@onClientError`, `@onConnectionError` | Error object |
| `@Function()` | `@onPreConnect`, `@onAuthenticate`, `@onAuthorizePublish`, `@onAuthorizeSubscribe` | Callback function |
| `@Host()` | Any handler | Host information |

---

## Stay in Touch

- Author — [@binarybeast](https://twitter.com/binarybeastt)
- GitHub — [binaryb3ast/pigeon-mqtt-nest](https://github.com/binaryb3ast/pigeon-mqtt-nest)

---

## License

MIT — see [LICENSE](LICENSE) for details.
