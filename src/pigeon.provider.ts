import { Provider, Logger } from '@nestjs/common';
import { Aedes } from 'aedes';
import { PigeonModuleOptions } from './pigeon.interface';
import {
  INSTANCE_BROKER,
  INSTANCE_SERVER,
  LOGGER_KEY,
  PIGEON_OPTION_PROVIDER,
} from './pigeon.constant';
import { createServer } from 'aedes-server-factory';
import { Transport } from './enum/pigeon.transport.enum';
import type { Server } from 'node:http';

/**
 * Creates providers for both the Aedes broker and the underlying TCP/WS server.
 * The server reference is needed for clean shutdown (closing the listening socket).
 * @returns An array of provider configuration objects.
 */
export function createClientProviders(): Provider[] {
  // Shared state between the two factory providers.
  // The broker factory runs first (due to token ordering) and populates these.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let brokerRef: Aedes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let serverRef: any;

  const brokerProvider: Provider = {
    provide: INSTANCE_BROKER,
    useFactory: async (options: PigeonModuleOptions) => {
      Logger.log('Creating Broker Instance', LOGGER_KEY);
      const brokerOptions = { ...options };
      if (!brokerOptions.transport) {
        Logger.log('Setting Default Transport For Mqtt < TCP >', LOGGER_KEY);
        brokerOptions.transport = Transport.TCP;
      }
      const broker = new Aedes(brokerOptions);
      await broker.listen();
      brokerRef = broker;
      try {
        if (brokerOptions.transport === Transport.TCP) {
          serverRef = await createServer(broker).listen(brokerOptions.port);
          Logger.log(
            `Creating TCP Server on Port ${brokerOptions.port}...`,
            LOGGER_KEY,
          );
        }
        if (brokerOptions.transport === Transport.WS) {
          serverRef = await createServer(broker, { ws: true }).listen(brokerOptions.port);
          Logger.log(`Creating WS Server on Port ${brokerOptions.port}...`, LOGGER_KEY);
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

  const serverProvider: Provider = {
    provide: INSTANCE_SERVER,
    useFactory: () => serverRef as Server,
  };

  return [brokerProvider, serverProvider];
}
