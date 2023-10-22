import {
  PigeonModuleAsyncOptions,
  PigeonModuleOptions,
  PigeonOptionsFactory,
} from 'pigeon.interface';
import { Logger, Provider } from '@nestjs/common';
import {
  INSTANCE_BROKER,
  LOGGER_KEY,
  PIGEON_LOGGER_PROVIDER,
  PIGEON_OPTION_PROVIDER,
} from 'pigeon.constant';

// Function that creates a NestJS provider for Pigeon MQTT options
export function createOptionsProvider(
  options: PigeonModuleAsyncOptions,
): Provider {
  Logger.log('Creating Option Provider', LOGGER_KEY);
  // If options include a factory function, create a provider with that factory
  if (options.useFactory) {
    return {
      provide: PIGEON_OPTION_PROVIDER,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }
  // If options include an existing provider, create a provider that uses that provider's factory function
  if (options.useExisting) {
    return {
      provide: PIGEON_OPTION_PROVIDER,
      useFactory: async (optionsFactory: PigeonOptionsFactory) =>
        await optionsFactory.createPigeonConnectOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}

// Function that creates a collection of NestJS providers for Pigeon MQTT options and the MQTT broker instance
export function createOptionProviders(
  options: PigeonModuleAsyncOptions,
): Provider[] {
  Logger.log('Creating Option Provider', LOGGER_KEY);
  // If options include an existing or factory provider, create a provider array with that provider
  if (options.useExisting || options.useFactory) {
    return [createOptionsProvider(options)];
  }

  // Otherwise, create a provider array with the MQTT broker instance provider and the options provider
  return [
    {
      provide: INSTANCE_BROKER,
      useFactory: async (optionFactory: PigeonOptionsFactory) =>
        await optionFactory.createPigeonConnectOptions(),
      inject: [options.useClass],
    },
    {
      provide: options.useClass,
      useClass: options.useClass,
    },
  ];
}

// Function that creates a NestJS provider for the Logger class
export function createLoggerProvider(
  options: PigeonModuleOptions | PigeonModuleAsyncOptions,
): Provider {
  Logger.log('Creating Logger Provider', LOGGER_KEY);
  // Create a provider for the Logger instance with the name 'MqttModule'
  return {
    provide: PIGEON_LOGGER_PROVIDER,
    useValue: new Logger('MqttModule'),
  };
}
