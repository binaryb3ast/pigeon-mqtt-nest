import { PigeonModuleAsyncOptions, PigeonModuleOptions, PigeonOptionsFactory } from './pigeon.interface';
import { Logger, Provider } from '@nestjs/common';
import { INSTANCE_BROKER, PIGEON_LOGGER_PROVIDER, PIGEON_OPTION_PROVIDER } from './pigeon.constant';

export function createOptionsProvider(
  options: PigeonModuleAsyncOptions,
): Provider {
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
      inject: [options.useExisting || options.useClass],
    };
  }
}

export function createOptionProviders(
  options: PigeonModuleAsyncOptions,
): Provider[] {
  if (options.useExisting || options.useFactory) {
    return [createOptionsProvider(options)];
  }
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

export function createLoggerProvider(options: PigeonModuleOptions | PigeonModuleAsyncOptions): Provider {
  return {
    provide: PIGEON_LOGGER_PROVIDER,
    useValue: new Logger('MqttModule'),
  };
}