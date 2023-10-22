import { Provider, Logger } from '@nestjs/common';
import Aedes from 'aedes';
import { createBroker } from 'aedes';
import { PigeonModuleOptions } from 'pigeon.interface';
import {
  INSTANCE_BROKER,
  LOGGER_KEY,
  PIGEON_OPTION_PROVIDER,
} from 'pigeon.constant';
import { createServer } from 'aedes-server-factory';
import { Transport } from 'enum/pigeon.transport.enum';

/**
 * Creates a provider function that generates a Pigeon MQTT broker instance based on the provided options.
 * @returns A provider configuration object for the Pigeon MQTT broker.
 */
export function createClientProvider(): Provider {
  return {
    provide: INSTANCE_BROKER,
    useFactory: async (options: PigeonModuleOptions) => {
      // Log that a broker instance is being created
      Logger.log('Creating Broker Instance', LOGGER_KEY);
      if (!options.transport) {
        Logger.log('Setting Default Transport For Mqtt < TCP >', LOGGER_KEY);
        options.transport = Transport.TCP;
      }
      // Create a new instance of Aedes broker using the options passed in
      const broker: Aedes = createBroker(options);
      // If a port is provided in the options, create a server using the broker and listen on that port
      if (options.transport == Transport.TCP) {
        await createServer(broker).listen(options.port);
        Logger.log(
          `Creating TCP Server on Port ${options.port}...`,
          LOGGER_KEY,
        );
      }

      // If a WebSocket port is provided in the options, create a server using the broker with WebSocket enabled and listen on that port
      if (options.transport == Transport.WS) {
        await createServer(broker, { ws: true }).listen(options.port);
        Logger.log(`Creating WS Server on Port ${options.port}...`, LOGGER_KEY);
      }

      // Return the created broker instance
      return broker;
    },
    // Inject the Pigeon module options into the function
    inject: [PIGEON_OPTION_PROVIDER],
  };
}
