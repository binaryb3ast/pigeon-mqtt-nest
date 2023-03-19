import { Inject, Injectable } from '@nestjs/common';
import {
  ListenOn,
  Payload,
  Topic,
  onHeartBeat,
  onUnsubscribe,
  onClient,
  PigeonService,
  onClientReady,
  onClientDisconnect,
  onSubscribe,
  Client,
  Host,
  Subscription,
  onPublish,
  Packet,
  onAuthenticate,
  Credential,
  Function,
  onAuthorizePublish,
  onPreConnect,
  onAuthorizeSubscribe,
  onKeepLiveTimeout,
  onAck,
  onClosed, onConnackSent, Error, onClientError, onConnectionError
} from "./index";
@Injectable()
export class TestService {

  constructor(@Inject(PigeonService) private readonly pigeonService: PigeonService) {
  }

  @onHeartBeat()
  heartBeat(@Host() host) {
    console.log(`Function: @OnHeartBeat()`);
  }

  @onUnsubscribe()
  OnUnsubscribe(@Subscription() subscription, @Client() client) {
    console.log("Function: @OnUnsubscribe()");
  }

  @onSubscribe()
  OnSubscribe(@Subscription() subscription, @Client() client) {
    console.log("Function: @OnSubscribe()");
  }

  @onClient()
  OnNewClient(@Client() client) {
    console.log("Function: @onClient()");
  }

  @onClientReady()
  async onClientReady(@Client() client) {
    console.log("Function: @onClientReady()");
  }

  @onClientDisconnect()
  OnClientDisconnect(@Client() client) {
    console.log("Function: @OnClientDisconnect()");
  }

  @onClientError()
  OnClientError(@Client() client, @Error() error) {
    console.log("Function: @onClientError()");
  }

  @onConnectionError()
  OnConnectionError(@Client() client, @Error() error) {
    console.log("Function: @OnConnectionError()");
  }

  @onPublish()
  OnPublish(@Topic() topic, @Packet() packet, @Payload() payload, @Client() client) {
    console.log("Function: @OnPublish()");
  }

  @ListenOn("test")
  async behnam(@Topic() topic, @Packet() packet, @Client() client) {
    console.log("Function: @behnam()");

    this.pigeonService.getBrokerInstance().closed;

    await this.pigeonService.publish({
      topic: "test2", qos: 0, cmd: "publish", payload: "", dup: false, retain: false
    });
  }

  @onAuthenticate()
  onAuthenticate(@Client() client, @Credential() credential, @Function() done) {
    console.log("Function: @onAuthenticate()");
    return done(null, true);
  }

  @onPreConnect()
  onPreConnect(@Client() client, @Packet() packet, @Function() done) {
    console.log("Function: @onPreConnect()");
    return done(null, true);
  }

  @onAuthorizeSubscribe()
  onAuthorizeSubscribe(@Client() client, @Subscription() subscription, @Function() done) {
    console.log("Function: @onAuthorizeSubscribe()");
    return done(null, subscription);
  }

  @onAuthorizePublish()
  onAuthorizePublish(@Client() client, @Packet() packet, @Function() done) {
    console.log("Function: @onAuthorizePublish()");
    return done(null);
  }

  @onKeepLiveTimeout()
  onKeepLiveTimeout(@Client() client) {
    console.log("Function: @onKeepLiveTimeout()");
  }

  @onAck()
  onAck(@Client() client, @Packet() packet) {
    console.log(packet);
    console.log("Function: @onAck()");
  }

  @onConnackSent()
  onConnackSent(@Client() client, @Packet() packet) {
    console.log("Function: @onConnackSent()");
  }

  @onClosed()
  onClosed(@Client() client, @Packet() packet) {
    console.log("Function: @onClosed()");
  }
}