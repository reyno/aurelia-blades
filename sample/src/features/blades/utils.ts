
export function parseBladeDefinition(config: string): { definition: string; name: string; params: string[]; view: string } {

    // parse the "blade-name(params,...):view" string
    // into the object:
    // {
    //     name: "",
    //     params: [],
    //     view: ""
    // }

    const regex = new RegExp(/([a-z\-]*)(?:(?:\()(.*)(?:\)))?(?:(?:\:)([a-z\-]*))?/);
    const match = <any[]>regex.exec(config);

    return {
        definition: config,
        name: match[1],
        params: (match[2] || "").split(",").filter(param => param.length > 0),
        view: match[3]
    }

}

export function buildBladeDefinition(config: {
    name: string;
    view?: string;
    params?: string[]
}) {

    const view = !!config.view
        ? `:${config.view}`
        : ""
        ;

    const params = config.params && config.params.length > 0
        ? `(${config.params.join(",")})`
        : ""
        ;

    return `${config.name}${params}${view}`;

}