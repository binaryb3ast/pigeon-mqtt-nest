import { Inject, Injectable } from '@nestjs/common';
import { INSTANCE_BROKER } from './pigeon.constant';
import { PubPacket } from './pigeon.interface';
import { Aedes } from 'aedes';

@Injectable()
export class PigeonService {
  private closed = false;

  constructor(
    @Inject(INSTANCE_BROKER) private readonly broker: Aedes, // Injects the Aedes broker instance
  ) {}

  /**
   * Publishes a message to a topic using the MQTT broker.
   * @param packet - The MQTT publish packet containing the message and topic.
   * @returns A promise that resolves with the published packet if successful, or rejects with an error.
   */
  publish(packet: PubPacket): Promise<PubPacket> {
    return new Promise<PubPacket>((resolve, reject) => {
      // Aedes 1.2.x runtime accepts (packet, client?, done?) but the type
      // definitions only declare the 2-arg form. Cast to access the full API.
      (
        this.broker as unknown as {
          publish(
            packet: PubPacket,
            client: unknown,
            done: (error?: Error) => void,
          ): void;
        }
      ).publish(packet, null, (error?: Error) => {
        if (error) {
          return reject(error);
        }
        return resolve(packet);
      });
    });
  }

  /**
   * Closes the connection to the MQTT broker.
   * @returns A promise that resolves with 'success' when the broker connection is closed.
   */
  close(): Promise<string> {
    if (this.closed) {
      return Promise.resolve('success');
    }
    this.closed = true;
    return new Promise<string>((resolve) => {
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
