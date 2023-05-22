//LiteGraph.NODE_MODES = [];

var graph = new LGraph();
var graphCanvas = new LGraphCanvas("#mycanvas", graph);


// var node_const = LiteGraph.createNode("flow/HTTPHandler");
// node_const.pos = [200,200];
// graph.add(node_const);
// node_const.id = 1;
// //node_const.setValue(4.5);

// var node_watch = LiteGraph.createNode("transactions/authTransMap");
// node_watch.pos = [700,200];
// graph.add(node_watch);
// node_watch.id = 2;
// //node_const.connect(0, node_watch, 0 );

//graph.start()

function updateEditorHiPPICanvas(w) {
    const ratio = window.devicePixelRatio;
    if(ratio == 1) { return }
    let canvas = document.getElementById("mycanvas");
    const rect = canvas.parentNode.getBoundingClientRect();
    let { width, height } = rect;

    if(w) width = w;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.getContext("2d").scale(ratio, ratio);
    return canvas;
}


window.graphcanvas = graphCanvas;
window.graph = graph;

var socket = io();


function registerNode(s, registerWithError){

    let pathArr = s.path.split("\/");

    if(pathArr.length == 1){
        pathArr.unshift("root");
    }

    let scriptName = pathArr[pathArr.length - 1];
    let path = pathArr.slice(0, pathArr.length - 1).join("/");
    let className = scriptName.split(".")[0];

    let inputBlock = "";
    let outputBlock = "";

    s.inputData.forEach(d => {
        inputBlock +=`this.addInput("${d.name}", "${d.type}" );\r\n`
    });

    s.inputActions.forEach(i => {
        inputBlock +=`this.addInput("${i}", LiteGraph.ACTION );\r\n`
    });

    s.outputData.forEach(d => {
        outputBlock +=`this.addOutput("${d.name}", "${d.type}" );\r\n`
    });

    s.outputActions.forEach(i => {
        outputBlock +=`this.addOutput("${i}", LiteGraph.ACTION );\r\n`
    });

    let strS = "(class Script extends LGraphNode{" +
        "constructor(){" +
        "super();"+
        inputBlock +
        outputBlock +
        "}" +
        "})";

    let cScript = eval("(class "+className+" extends LGraphNode{" +
        "constructor(){" +
        "super();"+
        inputBlock +
        outputBlock +
        "this.title='" + className + "';" +
        "}" +
        "})"
    );

    // cScript.prototype.onAction = (action, data) => {
    //     console.log("action:",action);
    //
    //     setTimeout(()=>{
    //         this.triggerSlot(0);
    //     },1000);
    // }

    let registerName = path + "/" + scriptName;

    if(!s.error || (s.error && registerWithError)){
        LiteGraph.registerNodeType(registerName, cScript );
    }

    return registerName;
}
//graph.getNodeById(1).triggerSlot(0);