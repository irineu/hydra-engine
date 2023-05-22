class Checker extends Base{
    constructor() {
        super();

        super.addInputAction(this.onHandle);
        super.addOutputAction("onNext");

    }

    onHandle(ctx){
    }
}

module = Checker;