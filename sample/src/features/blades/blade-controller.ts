import { BladeService } from 'features/blades/blade-service';
import { Container, autoinject, observable, ObserverLocator } from "aurelia-framework";
import { getLogger, Logger } from "aurelia-logging";
import { Resolver } from 'aurelia-dependency-injection';
import { parseBladeDefinition } from 'features/blades/utils';
import { IBladeSettings } from 'features/blades';

export class BladeController {
    myPath: string;
    view: {
        name?: string;
        icon?: string;
        title?: string;
        moduleId: string;
        size?: "auto" | "small" | "medium" | "large" | "x-large" | "maximised" | "minimised";
    };
    subtitle: string;
    title: string;
    icon: string;
    size: string = "medium";
    moduleId: any;

    settings: { definition: string; name: string; params: string[]; view: string; };
    config: IBladeSettings;
    viewChanged: (name: string) => void | Promise<void>;
    initialised: boolean = false;
    params: any;
    data: any;
    isSelector: boolean;
    resolve: (value?: {} | PromiseLike<{}>) => void;
    controller: any;
    bladeService: BladeService;
    child: BladeController;
    logger: Logger;
    container: Container;

    subTitleChanged: (newValue: string) => void;
    sizeChanged: (newValue: string) => void;

    parent: BladeController = null;
    viewModel: any;
    path: string;
    onClose = new Promise<any>((resolve, reject) => this.resolve = resolve);

    canMinimise: boolean = true;
    canMaximise: boolean = true;
    canPin: boolean = true;

    constructor(public definition: string, parent?: BladeController, selector?: boolean, data?: any) {
        this.logger = getLogger("blade-controller");
        this.logger.debug("ctor()", arguments);
        this.parent = parent;
        this.container = ((parent && parent.container) || Container.instance).createChild();
        this.bladeService = this.container.get(BladeService);
        this.container.registerSingleton(BladeController, () => this);
        this.isSelector = !!selector;
        this.data = data;
    }

    async close(result?: any) {

        this.logger.debug("close()", { result });

        if (this.viewModel && typeof this.viewModel.canClose === 'function')
            if (!(await Promise.resolve(this.viewModel.canClose())))
                return;

        if (this.viewModel && typeof this.viewModel.closing === 'function')
            if (!(await Promise.resolve(this.viewModel.closing())))
                return;

        this.resolve(result);

    }

    async init() {

        if (this.initialised) return;

        // parse the definition string into an object
        this.settings = parseBladeDefinition(this.definition);

        // asynchronously load the config for this blade
        this.config = await this.bladeService.get(this.settings.name);

        // make sure the parent is initialised first
        if (this.parent) await this.parent.init();

        // initialise the parameters
        this.initParams();

        // initialise the view
        this.changeView();

        // activate?
        if (typeof this.config.activate === 'function')
            await Promise.resolve(this.config.activate(this));

        this.initialised = true;

    }

    async initParams() {
        // get any data passed in
        const data = this.data || {};

        // get the settings according to the blade definition
        const currentParams = (this.config.params || []).reduce(
            (prev: any, curr: { name: string }, i: number) => {
                const paramValue = this.settings.params[i];
                return !!paramValue ? { ...prev, ...{ [curr.name]: this.settings.params[i] } } : prev;
            }, {}
        );

        // get the parent params
        const parentParams = (this.parent && this.parent.params) || {};

        this.logger.debug("valueChanged()", { currentParams, parentParams });

        // set the blade params and add to the blade controller
        this.params = this.params = { ...data, ...parentParams, ...currentParams };
    }

    setSize(size: string) {
        this.sizeChanged(size);
    }

    onOpen: <TResult>(config: string, selector?: boolean, data?: any) => Promise<TResult>;

    async open(config: string, data?: any): Promise<any> {

        // if no onOpen is registered, do nothing
        if (typeof this.onOpen !== 'function') return;

        return await this.onOpen(config, false, data);

    }

    async select(config: string, data?: any): Promise<any> {
        this.logger
            .debug("select()", config)
            ;

        // if no onOpen is registered, do nothing
        if (typeof this.onOpen !== 'function') return;


        return await this.onOpen(config, true, data);

    }

    getPath = (): string => {
        if (!this.myPath) this.myPath = (this.parent && this.parent.getPath()) || '';
        return this.isSelector ? this.myPath : `${this.myPath}/${this.definition}`;
    }

    changeView(name?: string) {
        const previous = this.view && this.view.name;

        // find the view
        const viewName = name || this.settings.view;
        const viewIndex = !!viewName
            ? this.config.views.findIndex(x => x.name === viewName)
            : 0;

        this.logger.debug("changeView()", {
            definition: this.definition,
            name,
            viewName,
            previousView: this.view,
            nextView: this.config.views[viewIndex]
        });

        const nextView = this.config.views[viewIndex];

        if (nextView === this.view) return;

        this.view = nextView;

        // set the module id, icon, title, size
        this.moduleId = this.view.moduleId;
        this.icon = this.config.icon || this.icon;
        this.title = this.config.title;
        this.subtitle = this.config.subtitle || this.subtitle;
        this.size = this.view.size || this.config.size || "medium";

        // update the definition
        const viewSuffix = !!viewName ? `:${viewName}` : "";
        const definition = this.definition;
        const colonIndex = definition.indexOf(":");
        const newDefinition = colonIndex === -1
            ? `${definition}${viewSuffix}`
            : `${definition.substring(0, colonIndex)}${viewSuffix}`

        this.definition = newDefinition;

        // call any subscribers
        this.viewChangedCallbacks.forEach(callback => callback(name));

    }

    private viewChangedCallbacks: ((name: string) => void)[] = [];

    onViewChanged(callback: (name: string) => void | Promise<void>) {
        this.viewChangedCallbacks.push(callback);
    }
    
    private sizeChangedCallbacks: ((name: string) => void)[] = [];

    onSizeChanged(callback: () => void | Promise<void>) {
        this.sizeChangedCallbacks.push(callback);
    }

}