import { autoinject, BindingEngine } from 'aurelia-framework';
import './blade-tabs.less';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { BladeController } from './blade-controller';

@autoinject
export class BladeTabs {

    private subscriptions: Subscription[];
    private controllers: BladeController[] = [];
    private _cacheKey: string = "_cm_blades_tabs";

    activeController: BladeController;

    constructor(
        private element: Element,
        private eventAggregator: EventAggregator,
        private bindingEngine: BindingEngine
    ) {
    }

    attached() {

        this.subscriptions = [
            this.eventAggregator.subscribe("blades:tabs:open", this._open.bind(this))
        ];

        this.subscriptions.push(
            this.bindingEngine
                .collectionObserver(this.controllers)
                .subscribe(() => {
                    this.element
                        .classList
                        .toggle("blade-tabs-empty", this.controllers.length === 0);
                })
        );
        this.init();

    }

    detached() {
        while (this.subscriptions && this.subscriptions.length) this.subscriptions.pop().dispose();
    }

    private _open(settings: { blade: string; params?: any }) {

        this.activeController = undefined;

        const {
            blade,
            params
        } = settings;

        // create the new blade controller
        const controller = new BladeController(blade, undefined, true, params);
        controller.canMinimise = false;
        controller.canMaximise = false;
        controller.canPin = false;

        // handle calls to open
        controller.onOpen = async <TResult>(blade, data) => {
            this.eventAggregator.publish("blades:router:open", blade);
            return Promise.resolve(undefined);
        };

        // handle calls to close
        controller.onClose.then(() => {

            // remove blade and children
            const index = this.controllers.indexOf(controller);
            if (index > -1) this.controllers.splice(index);

            // figure out which tab to display next
            const nextIndex = index > (this.controllers.length - 1)
                ? this.controllers.length - 1
                : index
                ;

            // display the next tab or nothing if none are left
            this.activeController = nextIndex > -1 ? this.controllers[nextIndex] : undefined;

            this.persist();

        });

        this.controllers.push(controller);

        this.activeController = controller;

        controller.init();

        this.persist();

    }

    private init() {

        const cached = localStorage.getItem(this._cacheKey);
        const data = !!cached && JSON.parse(cached);
        if (Array.isArray(data))
            (<any[]>data).forEach(item => this._open(item))


    }

    private persist() {

        const data = this.controllers.map(item => ({
            blade: item.definition,
            params: item.params
        }));

        localStorage.setItem(this._cacheKey, JSON.stringify(data));

    }


}