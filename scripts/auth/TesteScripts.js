class TesteScripts extends Base{
    constructor() {
        super();

        super.addInputAction(this.onHandle);
        super.addOutputAction(this.onNext);

    }

    onHandle(ctx){
    }

    onNext(ctx){}
}

module = TesteScripts;