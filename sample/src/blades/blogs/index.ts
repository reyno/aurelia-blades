import {
  FrameworkConfiguration,
  PLATFORM,
  Container
} from 'aurelia-framework';

import { BladeService } from 'features/blades';

export function configure(config: FrameworkConfiguration, options: any) {

  // get the blade service from dependency injection
  const bladeService: BladeService = Container.instance.get(BladeService);

  // register all the suported blades
  bladeService.register([{
    name: "blogs",
    icon: "user",
    title: "Blogs",
    views: [{
      "moduleId": PLATFORM.moduleName("blades/blogs/list")
    }]
  }, {
    name: "blog",
    icon: "user",
    title: "Blog Details",
    params: [{
      name: 'blogId',
      optional: false
    }],
    views: [{
      "moduleId": PLATFORM.moduleName("blades/blogs/detail")
    }]
  }]);

}

