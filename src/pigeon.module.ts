import { DynamicModule, Global, Module } from "@nestjs/common";
import { PigeonModuleAsyncOptions, PigeonModuleOptions } from "pigeon.interface";
import { PIGEON_OPTION_PROVIDER } from "pigeon.constant";
import { createClientProvider } from "pigeon.provider";
import { PigeonService } from "pigeon.service";
import { createLoggerProvider, createOptionProviders } from "option.provider";
import { PigeonExplorer } from "pigeon.explorer";
import { DiscoveryModule } from "@nestjs/core";

@Global()
@Module({
  imports: [DiscoveryModule],
  exports: [PigeonService]
})
export class PigeonModule {

  public static forRootAsync(options: PigeonModuleAsyncOptions): DynamicModule {
    return {
      module: PigeonModule,
      providers: [
        ...createOptionProviders(options),
        createLoggerProvider(options),
        createClientProvider(),
        PigeonExplorer,
        PigeonService
      ]
    };
  }

  public static forRoot(options: PigeonModuleOptions): DynamicModule {
    return {
      module: PigeonModule,
      providers: [
        {
          provide: PIGEON_OPTION_PROVIDER,
          useValue: options
        },
        createLoggerProvider(options),
        createClientProvider(),
        PigeonExplorer,
        PigeonService
      ]
    };
  }
}