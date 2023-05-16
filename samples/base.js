inputData = [];
outputData = [];

inputActions = [];
outputActions = [];


class Base{
    constructor() {

    }

    setInputData(name, value){

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
}