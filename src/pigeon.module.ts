/**
 * The PigeonModule is a NestJS global module that provides MQTT functionality using the Pigeon library.
 * It includes options for configuring MQTT connections and exports the PigeonService to be used in other modules.
 */
import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  PigeonModuleAsyncOptions,
  PigeonModuleOptions,
} from 'pigeon.interface';
import { PIGEON_OPTION_PROVIDER } from 'pigeon.constant';
import { createClientProvider } from 'pigeon.provider';
import { PigeonService } from 'pigeon.service';
import { createLoggerProvider, createOptionProviders } from 'option.provider';
import { PigeonExplorer } from 'pigeon.explorer';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';

@Global() // Indicates that this module should be available globally
@Module({
  imports: [DiscoveryModule], // Importing DiscoveryModule to enable automatic service discovery
  exports: [PigeonService], // Exporting PigeonService to make it available for other modules to use
})
export class PigeonModule {
  /**
   * Creates a dynamic module for configuring the Pigeon MQTT service asynchronously.
   * @param options - An asynchronous configuration for Pigeon MQTT.
   * @returns A dynamic module with necessary providers and imports.
   */
  public static forRootAsync(options: PigeonModuleAsyncOptions): DynamicModule {
    return {
      module: PigeonModule, // Current module
      providers: [
        ...createOptionProviders(options), // Creates providers for Pigeon options
        createLoggerProvider(options), // Creates a provider for the logger
        createClientProvider(), // Creates a provider for the MQTT client
        PigeonExplorer, // Adds the PigeonExplorer service as a provider
        PigeonService, // Adds the PigeonService as a provider
      ],
    };
  }

  /**
   * Creates a dynamic module for configuring the Pigeon MQTT service.
   * @param options - Configuration options for Pigeon MQTT.
   * @returns A dynamic module with necessary providers and imports.
   */
  public static forRoot(options: PigeonModuleOptions): DynamicModule {
    return {
      module: PigeonModule, // Current module
      providers: [
        {
          provide: PIGEON_OPTION_PROVIDER, // Provider token for the Pigeon options
          useValue: options,
        },
        createLoggerProvider(options), // Creates a provider for the logger
        createClientProvider(), // Creates a provider for the MQTT client
        PigeonExplorer, // Adds the PigeonExplorer service as a provider
        PigeonService, // Adds the PigeonService as a provider
      ],
    };
  }
}
