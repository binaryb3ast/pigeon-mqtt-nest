import {
  PigeonModuleAsyncOptions,
  PigeonModuleOptions,
  PigeonOptionsFactory,
} from './pigeon.interface';
import { Logger, Provider } from '@nestjs/common';
import {
  LOGGER_KEY,
  PIGEON_LOGGER_PROVIDER,
  PIGEON_OPTION_PROVIDER,
} from './pigeon.constant';

/**
 * Function that creates a NestJS provider for Pigeon MQTT options.
 * @param options - The PigeonModuleAsyncOptions containing options for Pigeon MQTT.
 * @returns A NestJS provider for Pigeon MQTT options.
 */
export function createOptionsProvider(
  options: PigeonModuleAsyncOptions,
): Provider {
  Logger.log('Creating Option Provider', LOGGER_KEY);
  if (options.useFactory) {
    return {
      provide: PIGEON_OPTION_PROVIDER,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }
  if (options.useExisting) {
    return {
      provide: PIGEON_OPTION_PROVIDER,
      useFactory: async (optionsFactory: PigeonOptionsFactory) =>
        await optionsFactory.createPigeonConnectOptions(),
      inject: [options.useExisting, ...(options.inject || [])],
    };
  }
  if (options.useClass) {
    return {
      provide: PIGEON_OPTION_PROVIDER,
      useFactory: async (optionsFactory: PigeonOptionsFactory) =>
        await optionsFactory.createPigeonConnectOptions(),
      inject: [options.useClass, ...(options.inject || [])],
    };
  }
  throw new Error(
    'PigeonModule.forRootAsync() requires one of: useFactory, useExisting, or useClass',
  );
}

/**
 * Function that creates a collection of NestJS providers for Pigeon MQTT options.
 * @param options - The PigeonModuleAsyncOptions containing options for Pigeon MQTT.
 * @returns An array of NestJS providers for Pigeon MQTT options.
 */
export function createOptionProviders(
  options: PigeonModuleAsyncOptions,
): Provider[] {
  Logger.log('Creating Option Provider', LOGGER_KEY);
  const optionProvider = createOptionsProvider(options);
  if (options.useClass) {
    return [
      optionProvider,
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }
  return [optionProvider];
}

/**
 * Function that creates a NestJS provider for the Logger class.
 * @param options - The PigeonModuleOptions or PigeonModuleAsyncOptions.
 * @returns A NestJS provider for the Logger instance.
 */
export function createLoggerProvider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: PigeonModuleOptions | PigeonModuleAsyncOptions,
): Provider {
  Logger.log('Creating Logger Provider', LOGGER_KEY);
  // Create a provider for the Logger instance with the name 'MqttModule'
  return {
    provide: PIGEON_LOGGER_PROVIDER,
    useValue: new Logger('MqttModule'),
  };
}
