
this.rule = {
    "type": "flow/HTTPHandler.js",
    "output": {
        "onRequest": {
            "graphId": 2,
            "type": "auth/AuthChecker.js",
            "input": "onHandle",
            "output": {
                "onNext": {
                    "graphId": 5,
                    "type": "auth/AuthChecker.js",
                    "input": "onHandle2",
                    "output": {
                        "onNext": {
                            "graphId": 3,
                            "type": "auth/TesteScripts.js",
                            "input": "onHandle",
                            "output": {
                            }
                        }
                    }
                },
                "onNext3": {
                    "graphId": 6,
                    "type": "auth/TesteScripts.js",
                    "input": "onHandle",
                    "output": {
                        "onNext": {
                            "graphId": 7,
                            "type": "auth/TesteScripts.js",
                            "input": "onHandle",
                            "output": {
                            }
                        }
                    }
                }
            }
        }
    }
}


this.rule2 = {
    script: "a",
    events: {
        next: {
            script: "b",
            events: {
                next: {
                    script: "c",
                    events:{
                        next: {
                            script: "b",
                            events: {
                                next: {
                                    script: "b",
                                    events: {

                                    }
                                }
                            }
                        }
                    }
                },
                error: {

                }
            }
        },
        jump: {
            script: "c",
            events:{

            }
        },
        error: {

        }
    },
}

let ctxMap = {};

this.run = (rule, ctx) => {

    console.log("Running: " + ctx + ":" + rule.type);

    if(!ctxMap[ctx]){
        ctxMap[ctx] = {
            id : ctx
        }
    }

    if(rule.type && Object.keys(rule.output).length > 0){
        let script = scripts[rule.type];

        ctxMap[ctx].outputActions = [];

        let firstKey = Object.keys(rule.output)[0];
        console.log(firstKey)
        if(rule.output[firstKey].type){
            ctxMap[ctx].outputActions[firstKey] = () => {

                //ctxMap[ctx].outputActions = [];

                run(rule.output[firstKey], ctx);
            }
        }

        // Object.keys(rule.output).forEach(e => {
        //
        //     if(rule.output[e].type){
        //         ctxMap[ctx].outputActions[e] = () => {
        //
        //             //ctxMap[ctx].outputActions = [];
        //
        //             run(rule.output[e], ctx);
        //         }
        //     }
        //
        //     // if(rule.events[e].script){
        //     //     script[e] = () => {
        //     //         run(rule.events[e], ctx);
        //     //     }
        //     // }else if(e == 'error'){
        //     //     script[e] = () => {
        //     //         //console.log("on error!!");
        //     //     }
        //     //
        //     // }else{
        //     //     //console.log("event not set");
        //     // }
        //
        // });

        //todo mudar para key

        if(rule.input){
            script[rule.input](ctxMap[ctx]);
        }else{
            //script.onHandle(ctxMap[ctx]);
            //script.onRequest(ctxMap[ctx]);
            run(rule.output["onRequest"], ctx);
        }

    }else{
        console.log("done end finish");
        end(ctx);
    }

    //console.log(JSON.stringify(rule))
    //console.log(JSON.stringify(ctx))

    //console.log("a")

    return 0;
}
//run(rule);