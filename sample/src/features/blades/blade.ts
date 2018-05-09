import { EventAggregator } from 'aurelia-event-aggregator';
import {
    autoinject,
    bindable,
    BindingEngine,
    CompositionContext,
    CompositionEngine,
    Controller,
    observable,
    ObserverLocator,
    PLATFORM,
    View,
    ViewFactory,
    ViewResources,
    ViewSlot,
} from 'aurelia-framework';
import { getLogger, Logger } from "aurelia-logging";
import { BladeController } from './blade-controller';
import './blade.less';
import { BladeService } from './blade-service';
import { parseBladeDefinition, buildBladeDefinition } from './utils';
import { IBladeSettings, IBladeConfig } from './types';
import { TaskQueue } from 'aurelia-task-queue';

@autoinject
export class Blade {
    controllerPromise: Promise<void>;
    loading: boolean = true;
    _maximised: boolean;
    _collapsed: boolean;
    bindingContext: any;
    controller: Controller;
    template: any;
    viewSlot: ViewSlot;
    logger: Logger;


    @bindable value: BladeController;

    bladeIcon: string = "spinner fa-spin";
    bladeTitle: string = "Loading...";
    bladeSubTitle: string = "";
    bladeViews: any[] = [];
    bladeView: string;
    bladeModuleId = './blade-loading';
    bladeSize: string = "medium";
    bladeCollapsable: boolean = true;
    bladeMaximisable: boolean = true;

    constructor(
        private compositionEngine: CompositionEngine,
        private viewResources: ViewResources,
        private viewFactory: ViewFactory,
        private element: Element,
        private bladeService: BladeService,
        private bindingEngine: BindingEngine,
        private taskQueue: TaskQueue,
        private observerLocator: ObserverLocator,
        private eventAggregator: EventAggregator
    ) {
        this.logger = getLogger("Blade");
    }

    async valueChanged() {

        this.value.onViewChanged((name: string) => {
            this.renderView();
        });

        await this.value.init();

        this.renderView();

    }

    async attached() {

        this.loading = true;

        this.viewSlot = this.viewSlot || new ViewSlot(this.template, false);
        this.viewSlot.removeAll();

        this.value.onViewChanged((name: string) => {
            this.renderView();
        });

        await this.value.init();

    }

    detached() {
        this.logger.debug("detached()", this.value.definition);
        this.controller && this.controller.detached();
    }

    async renderView(showLoading: boolean = true) {

        this.logger.debug("renderView()", {
            currentController: this.controller,
            bladeController: this.value
        });

        this.loading = showLoading;

        // detached() and unbind() for all views in the viewslot
        this.viewSlot.detached();
        this.viewSlot.unbind();

        try {

            this.controller = await this.compositionEngine.compose({
                viewModel: this.value.moduleId,
                model: this.value.params,
                container: this.value.container,
                bindingContext: this.bindingContext,
                viewResources: this.viewResources,
                viewSlot: this.viewSlot
            }) as Controller;

            // attached() for all views in the viewslot
            this.viewSlot.attached();

            this.loading = false;


        } catch (error) {
            this.logger.error("renderView()", error);
            await this.renderError({ Message: error });
        }



    }

    async renderError(error) {

        this.value.title

        if (this.value.title === "Loading...") {
            this.value.title = "Error";
            this.value.subtitle = "";
        }
        this.value.icon = "exclamation-triangle";
        this.value.moduleId = PLATFORM.moduleName("./blade-error");
        this.value.size = "large";
        this.value.params = error;
        await this.renderView();

    }

    bind(bindingContext) {
        this.bindingContext = bindingContext;
    }

    close() {
        this.value.close();
    }

    toggleCollapse() {
        const size = this.value.size === "minimised"
            ? this.value.config.size
            : "minimised"
            ;
        this.value.size = size;
    }

    toggleMaximise() {

        const size = this.value.size === "maximised"
            ? this.value.config.size
            : "maximised"
            ;

        this.value.size = size;

    }

    isViewActive(view) {
        return view.name == this.bladeView;
    }

    changeView(view) {
        this.value.changeView(view.name);
        this.renderView(false);
    }

    getIcon(item) {
        return item.icon || this.value.icon;
    }

    pin() {
        this.eventAggregator
            .publish("blades:tabs:open", {
                blade: this.value.definition,
                params: { ...this.value.params }
            });
    }

}