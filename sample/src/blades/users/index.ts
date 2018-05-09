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
    name: "users",
    icon: "user",
    title: "Users",
    views: [{
      "moduleId": PLATFORM.moduleName("blades/users/list")
    }]
  }, {
    name: "user",
    icon: "user",
    title: "User Details",
    params: [{
      name: 'userId',
      optional: false
    }],
    views: [{
      title: "Overview",
      name: "overview",
      moduleId: PLATFORM.moduleName("blades/users/detail/overview")
    },{
      title: "Blogs",
      name: "blogs",
      moduleId: PLATFORM.moduleName("blades/users/detail/blogs")
    }]
  }]);

}

