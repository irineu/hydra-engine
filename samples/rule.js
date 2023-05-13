let scripts = {
    a : new ModA(),
    b : new ModB(),
    c : new ModC()
}

this.rule = {
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

this.run = (rule, ctx) => {

    console.log("Running: " + ctx + ":" + rule.script);

    if(rule.script && Object.keys(rule.events).length > 0){
        let script = scripts[rule.script];

        Object.keys(rule.events).forEach(e => {
            if(rule.events[e].script){
                script[e] = () => {
                    run(rule.events[e], ctx);
                }
            }else if(e == 'error'){
                script[e] = () => {
                    //console.log("on error!!");
                }

            }else{
                //console.log("event not set");
            }

        });
        script.run();
    }else{
        //console.log("done end finish");
        end(ctx);
    }



    //console.log(JSON.stringify(rule))
    //console.log(JSON.stringify(ctx))

    //console.log("a")

    return 0;
}
//run(rule);