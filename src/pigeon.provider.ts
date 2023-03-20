import { Provider, Logger } from "@nestjs/common";
import Aedes, { createBroker } from "aedes";
import { PigeonModuleOptions } from "pigeon.interface";
import { INSTANCE_BROKER, LOGGER_KEY, PIGEON_OPTION_PROVIDER } from "pigeon.constant";
import { createServer } from "aedes-server-factory";

export function createClientProvider(): Provider {
  return {
    provide: INSTANCE_BROKER,
    useFactory: async (options: PigeonModuleOptions) => {
      Logger.log("Creating Broker Instance",LOGGER_KEY);
      let broker: Aedes = createBroker(options);
      if (options.port) {
        await createServer(broker).listen(options.port);
      }
      if (options.portWs) {
        await createServer(broker, { ws: true }).listen(options.portWs);
      }
      return broker;
    },
    inject: [PIGEON_OPTION_PROVIDER]
  };
}