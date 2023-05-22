class ModB extends Base{
    constructor(){
        super();
    }

    onHandle(ctx) {
        console.log(JSON.stringify(ctx));

        ctx["b"] = true;

        this.callOutputAction("next", ctx);
    }
}