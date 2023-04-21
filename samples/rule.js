let scripts = {
    a : new ModA(),
    b : new ModB(),
    c : new ModC()
}

function run(s){
    console.log("param s");
    console.log(s);
    if(s.script && Object.keys(s.events).length > 0){
        let script = scripts[s.script];

        Object.keys(s.events).forEach(e => {
            if(s.events[e].script){
                script[e] = () => {
                    run(s.events[e]);
                }
            }else if(e == 'error'){
                script[e] = () => {
                    console.log("on error!!");
                }

            }else{
                console.log("event not set");
            }

        });
        console.log("----")
        script.run();
    }else{
        console.log(s);
        console.log("done end finish");
    }

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

this.run2 = (s) => {
}
//run(rule);