class AuthChecker extends Base{
    constructor() {
        super();
   
        super.addInputAction(this.onHandle);
        super.addInputAction(this.onHandle2);
        super.addOutputAction("onNext");
        super.addOutputAction("onNext3");
        
        //super.addOutputAction("onNext4");

        super.addOutputData("isValid", "bool");
        super.addInputData("name", "string");

        super.setOutputData("isValid", true);

        //throw new Error("123");
    }

    onHandle(ctx){
        super.callOutputAction("onNext", ctx);
        //super.callOutputAction("onNext", ctx);
    }
    
     onHandle2(ctx){
        super.callOutputAction("onNext", ctx);
    }
}

module = AuthChecker;