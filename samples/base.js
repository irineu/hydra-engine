let scripts = {
}

error = null;

class Base{
    constructor() {

    }

    getInputData(name){

    }

    setOutputData(name, value){

    }

    addInputData(name, type){
    }

    addOutputData(name, type){
    }

    addInputAction(h){
    }

    addOutputAction(h){
    }

    callOutputAction(action, ctx){
        ctx.outputActions[action](ctx);
    }
}