import { autoinject, customAttribute, PLATFORM, DOM } from "aurelia-framework";
import { getLogger, Logger } from "aurelia-logging";
import { BladeController, BladeService } from "features/blades";

@customAttribute('blade-view-href')
@autoinject
export class BladeViewHref {
    bladeController: BladeController;
    logger: Logger;
    value: string;

    constructor(
        private element: Element,
        private bladeService: BladeService,
        bladeController: BladeController
    ) {
        this.logger = getLogger("blade-view-href");
        this.bladeController = bladeController instanceof BladeController
            ? bladeController
            : undefined
            ;
        this.element.addEventListener("click", this.click.bind(this));
    }

    valueChanged(newValue, oldValue) {

        const definition = this.bladeController.definition;

        const index = definition.indexOf(":");

        const newDefinition = index === -1
            ? definition + ":" + newValue
            : definition.substr(0, index) + ":" + newValue
            ;

        const path = this.bladeController.getPath();
        const parts = path.split("/");
        const href = [
            ...(parts.length === 1 ? [] : parts.slice(0, parts.length - 1))
            ,newDefinition
        ].join("/");

        this.element.setAttribute("href", href);

    }

    click(event: MouseEvent) {
        event.preventDefault();
        //this.logger.debug("click()", this.value);
        this.bladeController.changeView(this.value);
    }
}