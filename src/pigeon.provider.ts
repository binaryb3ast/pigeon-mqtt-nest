import { Provider, Logger } from '@nestjs/common';
import { Aedes } from 'aedes';
import { PigeonModuleOptions } from './pigeon.interface';
import {
  INSTANCE_BROKER,
  LOGGER_KEY,
  PIGEON_OPTION_PROVIDER,
} from './pigeon.constant';
import { createServer } from 'aedes-server-factory';
import { Transport } from './enum/pigeon.transport.enum';

/**
 * Creates a provider function that generates a Pigeon MQTT broker instance based on the provided options.
 * @returns A provider configuration object for the Pigeon MQTT broker.
 */
export function createClientProvider(): Provider {
  return {
    provide: INSTANCE_BROKER,
    useFactory: async (options: PigeonModuleOptions) => {
      Logger.log('Creating Broker Instance', LOGGER_KEY);
      if (!options.transport) {
        Logger.log('Setting Default Transport For Mqtt < TCP >', LOGGER_KEY);
        options.transport = Transport.TCP;
      }
      const broker = new Aedes(options);
      await broker.listen();
      try {
        if (options.transport === Transport.TCP) {
          await createServer(broker).listen(options.port);
          Logger.log(
            `Creating TCP Server on Port ${options.port}...`,
            LOGGER_KEY,
          );
        }
        if (options.transport === Transport.WS) {
          await createServer(broker, { ws: true }).listen(options.port);
          Logger.log(`Creating WS Server on Port ${options.port}...`, LOGGER_KEY);
        }
      } catch (error) {
        Logger.error('Failed to create server, closing broker', error, LOGGER_KEY);
        await broker.close();
        throw error;
      }
      return broker;
    },
    inject: [PIGEON_OPTION_PROVIDER],
  };
}
