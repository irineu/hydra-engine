class AuthChecker extends Base{
    constructor() {
        super();

        super.addInputAction(this.onHandle);
        super.addOutputAction(this.onNext);

        super.addOutputData("isValid", "bool");
        super.addInputData("name", "string");

        super.setOutputData("isValid", true);
    }

    onHandle(ctx){
    }

    onNext(ctx){}
}

module = AuthChecker;