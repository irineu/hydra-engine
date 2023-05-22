class AuthChecker extends Base{
    constructor() {
        super();

        super.addInputAction(this.onHandle);
        super.addOutputAction("onNext");

        super.addOutputData("isValid", "bool");
        super.addInputData("name", "string");

        super.setOutputData("isValid", true);

        //throw new Error("123");
    }

    onHandle(ctx){
        super.callOutputAction("onNext", ctx);
    }
}

module = AuthChecker;