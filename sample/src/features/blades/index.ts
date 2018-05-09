import {
  FrameworkConfiguration,
  PLATFORM
} from 'aurelia-framework';
import { getLogger } from 'aurelia-logging';
import { BladeService } from './blade-service';

export * from './types';
export * from './blade-controller';
export * from './blade-service';
export * from './blade-router';

export function configure(config: FrameworkConfiguration, options: (bladeService: BladeService) => void) {

  const logger = getLogger("features/blades/index");
  logger.debug("configure()", arguments);

  config.globalResources([
    PLATFORM.moduleName("./blade"),
    PLATFORM.moduleName("./blade-tabs"),
    PLATFORM.moduleName("./blade-router"),
    PLATFORM.moduleName("./blade-href"),
    PLATFORM.moduleName("./blade-error")
  ]);

  if (typeof options === "function")
    options(config.container.get(BladeService));


}
