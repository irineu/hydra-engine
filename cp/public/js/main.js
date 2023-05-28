//LiteGraph.NODE_MODES = [];

ace.require("ace/ext/language_tools");

var graph = new LGraph();
var graphCanvas = new LGraphCanvas("#mycanvas", graph);

var editorMap = {};
var windowMap = {};
var rawNodeMap = {};

function codeCompile(type){

    if(editorMap[type].node.code != editorMap[type].node.editCode){

        document.getElementById("status-"+editorMap[type].node.title).textContent = "compiling...";

        new RetroNotify({
            style: 'black',
            contentText: 'Compiling ' + editorMap[type].node.title + '...',
            animate: 'slideTopRight',
            closeDelay: 2000,
        });

        let rawNode = Object.assign({}, rawNodeMap[type]);
        rawNode.code = editorMap[type].node.editCode;

        //TODO remove root nodes

        socket.emit("compileCode", rawNode)
        console.log("xxx",rawNode );
        // setTimeout((title)=>{
        //     document.getElementById("status-"+title).textContent = "compiling...";
        // }, 2000, title);
    }
}

function codeSave(title){

}

function codeReset(title){

}

function connectionsChange( type, slot, connected, link_info, input_info){
    console.log(type == LiteGraph.INPUT ? "input" : "output", slot, connected, link_info, input_info);

    if(type == LiteGraph.INPUT){
        //console.log(graph.getNodeById(link_info.origin_id).type);
        console.log(graph.getNodeById(link_info.origin_id).outputs[link_info.origin_slot]);
        console.log(graph.getNodeById(link_info.target_id).inputs[link_info.target_slot]);

        fetch("blueprint/update-links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mode : connected ? "connect": "disconnect",
                links: [
                    {
                        type: graph.getNodeById(link_info.origin_id).type,
                        outputAction: graph.getNodeById(link_info.origin_id).outputs[link_info.origin_slot].name
                    },
                    {
                        type: graph.getNodeById(link_info.target_id).type,
                        inputAction: graph.getNodeById(link_info.target_id).inputs[link_info.target_slot].name
                    },
                ]
            })
        }).then(async response => {
            console.log(response);
        });
        // console.log(graph.getNodeById(link_info.target_id).type);
        // console.log(rawNodeMap)
    }

}

////

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

    onConnectionsChange = connectionsChange;
}

LiteGraph.clearRegisteredTypes();

HTTPHandler.skip_list = true;
LiteGraph.registerNodeType("flow/HTTPHandler", HTTPHandler );

fetch("nodes").then(async response => {
    let scripts = await response.json();
    scripts.forEach((s) => {
        registerNode(s, false);
    });
});

let blueprint = null;
fetch("blueprint?name=main").then(async response => {
    blueprint = await response.json();
    console.log(blueprint);
});

////

var snippetManager = ace.require("ace/snippets").snippetManager;

var snippets = [
    {
        name: "addInputAction",
        content: "super.addInputAction(this.${1:functionName});"
    },
    {
        name: "addOutputAction",
        content: "super.addOutputAction(\"this.${1:functionName}\");"
    },
    {
        name: "addInputData",
        content: "super.addInputData(\"${1:name}\", \"${2:type}\");"
    },
    {
        name: "addOutputData",
        content: "super.addOutputData(\"${1:name}\", \"${2:type}\");"
    },

];
snippetManager.register(snippets, "javascript");

////


var node_const = LiteGraph.createNode("flow/HTTPHandler");
node_const.pos = [200,200];
graph.add(node_const);
node_const.id = 1;

//node_const.setValue(4.5);

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

updateEditorHiPPICanvas(0);

graphCanvas.getExtraMenuOptions = function (){
    return [
        {
            content: "Create new Node", callback: (info, entry, mouse_event) => {
                var canvas = LGraphCanvas.active_canvas;
                var ref_window = canvas.getCanvasWindow();

                let newNodePath = prompt("Type the node path and name:", "my_nodes/NewNode.js");

                let normalizedPath = registerNode({
                    path: newNodePath,
                    inputData: [],
                    outputData: [],
                    inputActions: ["onHandle"],
                    outputActions: ["onNext"]
                });

                var node_const = LiteGraph.createNode(normalizedPath);
                node_const.pos = canvas.convertEventToCanvasOffset(mouse_event);
                graph.add(node_const);
            }
        }
    ];
}

window.graphcanvas = graphCanvas;
window.graph = graph;

var socket = io();

socket.on("updateNode", (node) => {

    //if(node && node.path == urlParams.get("node")){

        console.log(node.valid, node.error);

        if(!node.valid) return;
        //graph.clear();

        //LiteGraph.clearRegisteredTypes();
        let nodeName = registerNode(node, true);

        let newType = LiteGraph.createNode(nodeName);
        let nodes = graph.findNodesByType(nodeName);

        //console.log(nodes);

        nodes.forEach(n => {

            let newInputs = newType.inputs.map(a => Object.assign({}, a));
            let newOutputs = newType.outputs.map(b => Object.assign({}, b));

            newInputs.forEach(ni => {

                let commonInput = n.inputs.find(oi => oi.name == ni.name && oi.type == ni.type);
                if(commonInput){
                    ni.link = commonInput.link;
                }

            });

            newOutputs.forEach(no => {

                let commonOutput = n.outputs.find(oo => oo.name == no.name && oo.type == no.type);
                if(commonOutput){
                    no.links = commonOutput.links;
                }
            });

            n.inputs = newInputs;
            n.outputs = newOutputs;


            n.setSize( n.computeSize() );
        });


        //let nodeInstance = LiteGraph.createNode(nodeName);
        //nodeInstance.pos = [100,100];
        //graph.add(nodeInstance);
    //}


    //if(!baseCode){
        //baseCode = node.code;
        //editor.setValue(baseCode);
    //}
});


function registerNode(s, registerWithError){

    let pathArr = s.path.split("\/");

    //TODO maybe remove
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

    //rawNodeMap[className] = s;
    rawNodeMap[s.path] = s;

    //avoid eval
    cScript.prototype.code = s.code;

    cScript.prototype.onConnectionsChange = connectionsChange;

    cScript.prototype.getMenuOptions = (canvas) => {
        return [
            {
                content: "Title",
                callback: LGraphCanvas.onShowPropertyEditor
            },
            {
                content: "View Code",
                callback: function(item, options, e, menu, node) {

                    console.log(node);

                    let w = new WinBox({
                        node: node,
                        title: node.title,
                        width: 450,
                        height: 500,
                        x: "center",
                        y: "center",
                        background: "#111",
                        html: "<div class='controls'>" +
                            "<button id=\"btn-compile-"+node.title+"\" onclick=\"codeCompile('"+node.type+"')\" class='disabled'>Compile and Save</button>" +
                            "<button id=\"btn-reset-"+node.title+"\" onclick=\"codeReset('"+node.type+"')\" class='disabled'>Reset</button>" +
                            "<span id=\"status-"+node.title+"\" class='status'></span>" +
                            "</div>" +
                            "<div id=\"editor-"+node.title+"\" class=\"editor\" ></div>",
                        oncreate: (options) => {

                            let editor = ace.edit("editor-"+options.node.title);
                            editor.setTheme("ace/theme/monokai");
                            editor.session.setMode("ace/mode/javascript");
                            //console.log(node);
                            
                            options.node.editCode = options.node.code;
                            editor.setValue(options.node.editCode);
                            editor.node = options.node;

                            editor.setOptions({
                                enableBasicAutocompletion: true,
                                enableSnippets: true,
                                enableLiveAutocompletion: false
                            });

                            editor.session.on('change', (delta) => {
                                console.log(this);
                                /*

                                //console.log(editor.getValue() != baseCode);

                                */
                                editor.node.editCode = editor.getValue();
                                if(editor.getValue() != editor.node.code){
                                    windowMap[options.node.type].setTitle(editor.node.title + "*");
                                    document.getElementById("btn-compile-" + editor.node.title).classList.remove("disabled");
                                }else{
                                    windowMap[options.node.type].setTitle(editor.node.title);
                                    document.getElementById("btn-compile-" + editor.node.title).classList.add("disabled");
                                }
                            });

                            editorMap[options.node.type] = editor;

                        },
                    });

                    windowMap[node.type] = w;


                }
            }
        ];
    }

    // {" +
    //     "           content: \"Code\"," +
    //     "           callback: () => " +
    //     "        }

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