import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { BladeController } from "./blade-controller";
import { PLATFORM, DOM, autoinject } from "aurelia-framework";
import './blade-router.less';
import { getLogger, Logger } from "aurelia-logging";

@autoinject
export class BladeRouter {
    private bladeStyles: Element;
    private controllers: BladeController[] = [];
    private logger: Logger;
    private subscriptions: Subscription[];

    constructor(
        private element: Element,
        private eventAggregator: EventAggregator
    ) {
        this.logger = getLogger("BladeRouter");
    }

    attached() {
        PLATFORM.addEventListener("popstate", this.handlePopstate.bind(this));
        PLATFORM.addEventListener("resize", this.handleResize.bind(this));
        this.subscriptions = [
            this.eventAggregator.subscribe("blade:router:open", blade => this.create(blade))
        ];
        this.init();
    }

    detached() {
        PLATFORM.removeEventListener("popstate", this.handlePopstate.bind(this));
        PLATFORM.removeEventListener("resize", this.handleResize.bind(this));
        while(this.subscriptions && this.subscriptions.length) this.subscriptions.pop().dispose();
    }

    private handlePopstate() {
        this.init();
    }

    private handleResize() {
        this.onResize();
        this.scrollToEnd();
    }

    private async init() {
        this.controllers = [];

        const parts = window.location.pathname.split("/").filter(part => part.length > 0);

        let controller = undefined;
        for (var i = 0; i < parts.length; i++)
            controller = await this.create(parts[i], controller);

        this.onResize();
    }

    private onResize() {
        if (!this.bladeStyles) {
            this.bladeStyles = DOM.createElement("style");
            DOM.querySelectorAll("head")[0].appendChild(this.bladeStyles);
        }

        const style = `.blade-size-maximised { width: ${this.element.clientWidth}px }`;

        this.bladeStyles.innerHTML = style;
    }

    private scrollToEnd() {
        const scrollX = this.element.scrollWidth - this.element.clientWidth;
        if (scrollX > 0) this.element.scrollTo({
            left: scrollX + 1
        });
    }

    async create(blade: string, parent?: BladeController, selector?: boolean, data?: any): Promise<BladeController> {
        this.logger.debug("create()", { this: this });

        // create the new blade controller
        const controller = new BladeController(blade, parent, selector, data);

        // handle calls to open
        controller.onOpen = async <TResult>(blade,selector, data) => await this.open<TResult>(blade, controller, selector, data);

        // handle calls to close
        controller.onClose.then(() => {
            // remove blade and children
            const index = this.controllers.indexOf(controller);
            if (index > -1) this.controllers.splice(index);

            // update the url
            this.updateUrl();
        });

        // handle changing of views (update the url)
        controller.onViewChanged(name => {
            this.updateUrl();
            this.scrollToEnd();
        });

        // if a parent is supplied, remove any descendents of that parent first
        if (!!parent) {
            const parentIndex = this.controllers.findIndex(item => item.container === parent.container);
            if (parentIndex > -1) this.controllers.splice(parentIndex + 1);
        }else {
            this.controllers.splice(0);
        }

        // add it to the array so it displays
        this.controllers.push(controller);

        // update the url
        this.updateUrl();

        // make sure the new blade is displayed
        this.scrollToEnd();

        return controller;
    }

    async open<TResult>(blade: string, parent?: BladeController, selector?: boolean, data?: any): Promise<TResult> {
        this.logger.debug("open()", { this: this });

        const controller = await this.create(blade, parent, selector, data);

        return new Promise<TResult>((resolve, reject) => {
            controller.onClose.then(result => {
                this.logger.debug("open()::onClose()", { result });

                // return the result to the opener
                resolve(result);
            });
        });
    }

    private updateUrl() {
        const count = this.controllers.length;
        const path = count === 0 ? "/" : this.controllers[count - 1].getPath();
        history.pushState({}, "", path);
    }
}