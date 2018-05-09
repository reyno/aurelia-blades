import { BladeController } from "./blade-controller";
import { parseBladeDefinition, buildBladeDefinition } from "./utils";
import { getLogger, Logger } from "aurelia-logging";
import { IBladeResolver, IBladeSettings } from "./types";
import {
    PLATFORM,
    Container,
    DOM,
    autoinject,
    Aurelia,
    Loader,
    FrameworkConfiguration,
    ViewEngine
} from "aurelia-framework";
import { IBladeConfig } from "features/blades";

@autoinject
export class BladeService {
    bladeLookups: {
        regex: RegExp,
        moduleName: string
    }[] = [];
    private registeredBlades: { [key: string]: any } = {};
    private activators: { [key: string]: Function } = {};
    logger: Logger;
    resolver: IBladeResolver;
    bladeCache: { [key: string]: Promise<IBladeSettings> } = {};

    constructor(
        private aurelia: Aurelia,
        private loader: Loader,
        private viewEngine: ViewEngine
    ) {

        Container.instance.registerSingleton(BladeController, () => null);

        this.logger = getLogger("BladeService");

    }

    useResolver = (resolver: IBladeResolver) => this.resolver = resolver;

    // either cache the cached promise, or load and cache the blade config
    get = async (name: string): Promise<IBladeSettings> => {

        let blade = this.registeredBlades[name];

        if (!blade) {
            const matches = this.bladeLookups.filter(lookup => lookup.regex.test(name));
            switch (matches.length) {
                case 0:
                    break;
                case 1:
                    blade = matches[0].moduleName;
                    break;
                default:
                    throw new Error(`Multiple matches found for blade: ${name}`);
            }
        }

        if (!blade) throw new Error("Blade not registered: " + name);

        // see if this is a module for dynamic loading
        if (typeof blade === 'string') {

            const module = await this.loader.loadModule(blade);
            const configure = module.configure;

            if (typeof configure !== 'function') throw new Error("no configure method found on the module");

            // configure the blade module
            await Promise.resolve(configure(new FrameworkConfiguration(this.aurelia)));

        }

        return this.registeredBlades[name];

    }

    registerActivator(name: string, activator: Function) {
        this.activators[name] = activator;
    }

    async activateController(name: string, bladeController: BladeController) {

        if (this.registeredBlades[name] && this.registeredBlades[name].activate) {
            this.logger.debug("activateController() - NEW");
            const result = this.registeredBlades[name].activate(bladeController);
            await Promise.resolve(result);
            // } else {
            //     this.logger.debug("activateController() - OLD");
            //     const activator = this.activators[name];
            //     if (!activator) return;
            //     await activator(bladeController);
        }

    }

    register(config: IBladeSettings | IBladeSettings[]) {
        const blades = Array.isArray(config) ? config : [config];
        const registered = blades.reduce((acc, curr) => ({ ...acc, ...{ [curr.name]: curr } }), this.registeredBlades);
        this.registeredBlades = registered;
    }

    registerBlades(moduleName: string, blades: (string | RegExp) | (string | RegExp)[]) {

        const items = Array.isArray(blades) ? blades : [blades];

        items.forEach(item => {
            if (typeof item === 'string')
                this.registeredBlades[item] = moduleName;
            else
                this.bladeLookups.push({
                    regex: item,
                    moduleName
                });
        });

    }

    registerViewModels(modules: string | string[]) {

        const items = Array.isArray(modules) ? modules : [modules];

        this.viewEngine.importViewResources(
            items,
            items.map(x => undefined),
            this.aurelia.resources
        );

    }


}