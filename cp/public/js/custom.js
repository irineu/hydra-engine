//node constructor class

class HTTPHandler {

    constructor() {
        this.title = "HTTP Handler";
        this.addOutput("onRequest", LiteGraph.ACTION);
    }

    getMenuOptions(canvas){
        return [{
            content: "Title",
            callback: LGraphCanvas.onShowPropertyEditor
        }];
    }
}
//
// class AuthTransactionMap {
//     constructor() {
//         this.properties = { precision: 1 };
//         this.title = "Auth Transactions";
//
//         this.addInput("onHandle", LiteGraph.ACTION, "multiple" );
//         //this.addInput("xpoto", LiteGraph.EVENT );
//
//         this.addOutput("onPix",LiteGraph.ACTION);
//         this.addOutput("onFinantial",LiteGraph.ACTION);
//         this.addOutput("onConsult",LiteGraph.ACTION);
//     }
//
//     onExecute(){
//         console.log("exec");
//         // var A = this.getInputData(0);
//         // if( A === undefined )
//         //     A = 0;
//         // var B = this.getInputData(1);
//         // if( B === undefined )
//         //     B = 0;
//         // this.setOutputData( 0, A + B );
//     }
//
//     onAction(action, data){
//         console.log("action:",action);
//
//         setTimeout(()=>{
//             this.triggerSlot(0);
//         },1000);
//     }
//
//     onTrigger(action, data)
//     {
//         console.log("trig:", action);
//     }
// }
//
// class NonAuthTransactionMap {
//     constructor() {
//         this.properties = { precision: 1 };
//         this.title = "NonAuth Transactions";
//
//         this.addInput("onHandle", LiteGraph.ACTION );
//         this.addOutput("onSignup",LiteGraph.ACTION);
//         this.addOutput("onSignin",LiteGraph.ACTION);
//     }
//
//     onExecute(){
//         console.log("exec");
//     }
//
//     onAction(action, data){
//         console.log("action:",action);
//
//         setTimeout(()=>{
//             this.triggerSlot(0);
//         },1000);
//     }
//
//     onTrigger(action, data)
//     {
//         console.log("trig:", action);
//     }
// }
//
// class PixHandler {
//
//     constructor() {
//         this.title = "Pix Handler";
//         this.addInput("onHandle", LiteGraph.ACTION );
//         //this.addInput("authRequired","boolean");
//     }
// }
//
// class SignInHandler {
//
//     constructor() {
//         this.title = "SignIn Handler";
//         this.addInput("onHandle", LiteGraph.ACTION );
//     }
// }
//
// class SignUpHandler {
//
//     constructor() {
//         this.title = "SignUp Handler";
//         this.addInput("onHandle", LiteGraph.ACTION );
//     }
// }
//
// class AuthChecker {
//
//     constructor() {
//         this.title = "Auth Checker";
//         this.addInput("onHandle", LiteGraph.ACTION );
//         this.addOutput("onAnonym", LiteGraph.ACTION );
//         this.addOutput("onAuth",LiteGraph.ACTION);
//
//     }
// }
//
// class BioScorer {
//
//     constructor() {
//         this.title = "Bio Scorer";
//         this.addInput("onHandle", LiteGraph.ACTION );
//         this.addOutput("onResult", LiteGraph.ACTION );
//     }
// }
//
// class SMDScorer {
//
//     constructor() {
//         this.title = "SMD Scorer";
//         this.addInput("onHandle", LiteGraph.ACTION );
//         this.addOutput("onResult", LiteGraph.ACTION );
//     }
// }
//
// class SafeGeoScorer {
//
//     constructor() {
//         this.title = "Safe GEO Scorer";
//         this.addInput("onHandle", LiteGraph.ACTION );
//         this.addOutput("onResult", LiteGraph.ACTION );
//     }
// }


//new LGraphNode().disconnectOutput()
//register in the system
//LiteGraph.registerNodeType("basic/sum", MyAddNode );

LiteGraph.clearRegisteredTypes();

HTTPHandler.skip_list = true;
LiteGraph.registerNodeType("flow/HTTPHandler", HTTPHandler );

//
// LiteGraph.registerNodeType("flow/AuthChecke", AuthChecker );
//
// LiteGraph.registerNodeType("scorer/BioScorer", BioScorer );
// LiteGraph.registerNodeType("scorer/SMDScorer", SMDScorer );
// LiteGraph.registerNodeType("scorer/SafeGeoScorer", SafeGeoScorer );
//
// LiteGraph.registerNodeType("transactions/nonAuthTransactionMap", NonAuthTransactionMap );
// LiteGraph.registerNodeType("transactions/authTransMap", AuthTransactionMap );
// LiteGraph.registerNodeType("transactions/auth/PixHandler", PixHandler );
// LiteGraph.registerNodeType("transactions/nonAuth/SignInHandler", SignInHandler );
// LiteGraph.registerNodeType("transactions/nonAuth/SignUpHandler", SignUpHandler );

fetch("nodes").then(async response => {
    let scripts = await response.json();
    scripts.forEach((s) => {
        registerNode(s, false);
    });
});