class ModC extends Base{
    constructor(){
        super();
    }

    onHandle(ctx) {
        console.log(JSON.stringify(ctx));
        this.callOutputAction("next", ctx);
    }
}