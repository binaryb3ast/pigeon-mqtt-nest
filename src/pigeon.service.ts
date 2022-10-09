import { Inject, Injectable } from "@nestjs/common";
import { INSTANCE_BROKER } from "./pigeon.constant";
import { Aedes} from "aedes";
import { PubPacket } from "./pigeon.interface";

@Injectable()
export class PigeonService {
  constructor(
    @Inject(INSTANCE_BROKER) private readonly broker: Aedes
  ) {
  }

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

}