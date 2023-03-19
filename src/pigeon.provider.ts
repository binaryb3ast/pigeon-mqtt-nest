import { Provider, Logger } from "@nestjs/common";
import Aedes, { createBroker } from "aedes";
import { PigeonModuleOptions } from "pigeon.interface";
import { INSTANCE_BROKER, PIGEON_OPTION_PROVIDER } from "pigeon.constant";
import { createServer } from "aedes-server-factory";

export function createClientProvider(): Provider {
  return {
    provide: INSTANCE_BROKER,
    useFactory: async (options: PigeonModuleOptions, logger: Logger) => {
      logger.log("Starting Create Client Provider");
      Logger.log("Creating Broker Instance");
      let broker: Aedes = createBroker(options);
      await createServer(broker, { ws: true }).listen(options.port);
      return broker;
    },
    inject: [PIGEON_OPTION_PROVIDER]
  };
}