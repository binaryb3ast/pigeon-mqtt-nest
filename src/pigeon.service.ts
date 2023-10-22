import { Inject, Injectable } from '@nestjs/common';
import { INSTANCE_BROKER } from 'pigeon.constant';
import { PubPacket } from 'pigeon.interface';
import Aedes from 'aedes';

@Injectable()
export class PigeonService {
  constructor(
    @Inject(INSTANCE_BROKER) private readonly broker: Aedes, // Injects the Aedes broker instance
  ) {}

  /**
   * Publishes a message to a topic using the MQTT broker.
   * @param packet - The MQTT publish packet containing the message and topic.
   * @returns A promise that resolves with the published packet if successful, or rejects with an error.
   */
  publish(packet: PubPacket): Promise<PubPacket> {
    return new Promise<any>((resolve, reject) => {
      this.broker.publish(packet, (error) => {
        if (!error) {
          return resolve(packet);
        }
        return reject(error);
      });
    });
  }

  /**
   * Closes the connection to the MQTT broker.
   * @returns A promise that resolves with 'success' when the broker connection is closed.
   */
  close(): Promise<string> {
    return new Promise<any>((resolve) => {
      this.broker.close(() => {
        resolve('success');
      });
    });
  }

  /**
   * Returns the MQTT broker instance used by the Pigeon service.
   * @returns The Aedes broker instance.
   */
  getBrokerInstance(): Aedes {
    return this.broker;
  }

  //todo: subscribe function

  //todo: unsubscribe function
}
