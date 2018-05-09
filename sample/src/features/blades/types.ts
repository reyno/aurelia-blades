import { BladeController } from "features/blades";

export type BladeSize = "small" | "medium" | "large" | "x-large" | "maximised" | "minimised";

export interface IBladeSettings {
    name: string;
    selector?: boolean;
    title: string;
    subtitle?: string;
    icon: string;
    activator?: string;
    size?: BladeSize;
    params?: {
        name: string;
        optional?: boolean
    }[];
    views: {
        name?: string;
        icon?: string;
        title?: string;
        moduleId: string;
        size?: BladeSize;
    }[],
    activate?: (bladeController: BladeController) => Promise<void>
}

export interface IBladeConfig {
    name: string;
    params: string[];
    view: string;
}

export interface IBladeResolver {
    get(name: string): Promise<IBladeSettings>;
}