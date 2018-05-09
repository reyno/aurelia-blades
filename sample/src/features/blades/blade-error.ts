export default class {
    error: any;
    activate(params) {
        console.log("blade-error:activate()", params);
        this.error = params;
    }
}