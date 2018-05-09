import { autoinject, customAttribute, PLATFORM, DOM } from "aurelia-framework";
import { getLogger, Logger } from "aurelia-logging";
import { BladeController, BladeService, BladeRouter } from "features/blades";
import { parseBladeDefinition, buildBladeDefinition } from "features/blades/utils";
import { EventAggregator } from "aurelia-event-aggregator";

@customAttribute('blade-href')
@autoinject
export class BladeHref {
    bladeController: BladeController;
    logger: Logger;
    value: string;

    constructor(
        private element: Element,
        private eventAggregator: EventAggregator,
        bladeController: BladeController
    ) {
        this.logger = getLogger("blade-href");
        this.bladeController = bladeController instanceof BladeController
            ? bladeController
            : undefined
            ;
        this.element.addEventListener("click", this.click.bind(this));
        (this.element as HTMLElement).style.cursor = 'pointer';
    }

    valueChanged(newValue, oldValue) {

        if (this.element.tagName !== "A") return;

        const parentPath = this.getParentPath();

        const definition = this.getCurrentDefinition();

        const href = `${parentPath}/${definition}`;

        this.element.setAttribute("href", href);

    }

    click(event: MouseEvent) {

        event.preventDefault();

        const definition = this.getCurrentDefinition();
        const parent = this.getParentController();

        if (this.bladeController) this.bladeController.open(definition, parent);
        else this.eventAggregator.publish("blade:router:open", definition);

    }

    getParentPath(): string {

        const parent = this.getParentController();
        return !!parent
            ? parent.getPath()
            : ""
            ;

    }

    getCurrentDefinition(): string {

        const currentDefinition = this.bladeController && parseBladeDefinition(this.bladeController.definition);
        const nextDefinition = parseBladeDefinition(this.value);

        // basic validation
        // if (!nextDefinition.name && !this.bladeController)
        //     throw new Error("Cannot open view link when not in the context of a blade controller");

        // determine the parent based on whether a blade name is provided
        const parent = this.getParentController();

        // if a view line, use the current blade name and params
        if (!nextDefinition.name && currentDefinition) {
            nextDefinition.name = currentDefinition.name;
            nextDefinition.params = currentDefinition.params;
        }

        // 
        const definition = buildBladeDefinition(nextDefinition);

        return definition;

    }

    getParentController(): BladeController {

        const definition = parseBladeDefinition(this.value);

        // determine the parent based on whether a blade name is provided
        const parent = !!definition.name
            ? this.bladeController
            : this.bladeController && this.bladeController.parent
            ;

        return parent;

    }

}