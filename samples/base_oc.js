inputData = [];
outputData = [];

inputActions = [];
outputActions = [];

error = null;

class Base{
    constructor() {

    }

    getInputData(name){

    }

    setOutputData(name, value){

    }

    addInputData(name, type){
        inputData.push({
            name: name,
            type: type
        });
    }

    addOutputData(name, type){
        outputData.push({
            name: name,
            type: type
        });
    }

    addInputAction(h){
        inputActions.push(h);
    }

    addOutputAction(h){
        outputActions.push(h);
    }

    callOutputAction(action, ctx){
        ctx.outputActions[action](ctx);
    }
}