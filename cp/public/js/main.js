//LiteGraph.NODE_MODES = [];

ace.require("ace/ext/language_tools");

var graph = new LGraph();
var graphCanvas = new LGraphCanvas("#mycanvas", graph);

var editorMap = {};
var windowMap = {};
var rawNodeMap = {};
let blueprint = null;

function saveGraph(){

    fetch("blueprint/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            blueprint: blueprint._id,
            graph: graph.serialize()
        })
    }).then(async response => {
        new RetroNotify({
            style: 'black',
            contentText: 'Blueprint saved!',
            animate: 'slideTopRight',
            closeDelay: 2000,
        });
    })
}

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

        //TODO remove root nodes from folder

        fetch("node/compile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                    blueprint: blueprint._id,
                    node: rawNode
                }
            )
        }).then(async response => {

            let result = await response.json();

            if(response.status == 400){

                new RetroNotify({
                    style: 'red',
                    contentText: 'Failed to compile ' + editorMap[type].node.title + '!',
                    animate: 'slideTopRight',
                    closeDelay: 2000,
                });

                alert("The following blueprints: " + result.restrictions.map(r => r.name).join(", ") + " are using that link. Please remove them first before save.")
            }else {
                onUpdateNode(result);
            }
        });

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

    if(!link_info) return;

    if(type == LiteGraph.INPUT){
        //console.log(graph.getNodeById(link_info.origin_id).type);
        // console.log(graph.getNodeById(link_info.origin_id).outputs[link_info.origin_slot]);
        // console.log(graph.getNodeById(link_info.target_id).inputs[link_info.target_slot]);

        let originIndex = blueprint.nodes.findIndex(n => rawNodeMap[graph.getNodeById(link_info.origin_id).type]._id == n.node);
        let targetIndex = blueprint.nodes.findIndex(n => rawNodeMap[graph.getNodeById(link_info.target_id).type]._id == n.node);

        if(originIndex > -1 && targetIndex > -1){
            let outputIndex = blueprint.nodes[originIndex].outputActionsInUse.indexOf(graph.getNodeById(link_info.origin_id).outputs[link_info.origin_slot].name);
            let inputIndex = blueprint.nodes[targetIndex].inputActionsInUse.indexOf(graph.getNodeById(link_info.target_id).inputs[link_info.target_slot].name);

            if(outputIndex > -1 && inputIndex > -1){
                return;
            }
        }

        fetch("blueprint/update-links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                blueprint: blueprint._id,
                mode : connected ? "connect": "disconnect",
                links: [
                    {
                        type: rawNodeMap[graph.getNodeById(link_info.origin_id).type]._id,
                        outputAction:  graph.getNodeById(link_info.origin_id).outputs[link_info.origin_slot].name
                    },
                    {
                        type: rawNodeMap[graph.getNodeById(link_info.target_id).type]._id,
                        inputAction: graph.getNodeById(link_info.target_id).inputs[link_info.target_slot].name
                    },
                ]
            })
        }).then(async response => {
            if (response.status == 200){
                saveGraph();
            }
        });
        // console.log(graph.getNodeById(link_info.target_id).type);
        // console.log(rawNodeMap)
    }

}

////

LiteGraph.clearRegisteredTypes();

//HTTPHandler.skip_list = true;
//LiteGraph.registerNodeType("flow/HTTPHandler", HTTPHandler );
//rawNodeMap["flow/HTTPHandler"] = HTTPHandler;

fetch("nodes").then(async response => {
    let scripts = await response.json();
    scripts.forEach((s) => {
        registerNode(s, false);
    });

    fetch("blueprint?name=main").then(async response => {
        blueprint = await response.json();

        // var node_const = LiteGraph.createNode("flow/HTTPHandler.js");
        // node_const.pos = [200,200];
        // graph.add(node_const);
        // node_const.id = 1;

        graph.configure(JSON.parse(blueprint.graph));
    });


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

function getNodeRegisterName(node) {
    let pathArr = node.path.split("\/");
    let scriptName = pathArr[pathArr.length - 1];
    let path = pathArr.slice(0, pathArr.length - 1).join("/");

    return path + "/" + scriptName;
}

function onUpdateNode (response) {

    //if(node && node.path == urlParams.get("node")){

        let node = response.node;

        console.log(node.valid, node.error);

        if(!node.valid) return;
        //graph.clear();

        //LiteGraph.clearRegisteredTypes();
        let registerName = getNodeRegisterName(node);


        graph.findNodesByType(registerName).forEach(inPlaceNode => {
            console.log(inPlaceNode)

            for (let i = 0; i < inPlaceNode.outputs.length; i++) {
                inPlaceNode.disconnectOutput(i);
            }

            for (let i = 0; i < inPlaceNode.inputs.length; i++) {
                inPlaceNode.disconnectInput(i);
            }

        });

        registerNode(node, true);

        //resize

        let newType = LiteGraph.createNode(registerName);
        let nodes = graph.findNodesByType(registerName);

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

        if(editorMap[node.path].node.code != node.code){
            editorMap[node.path].node.code = node.code;
            document.getElementById("btn-compile-" + editorMap[node.path].node.title).classList.add("disabled");
        }

        saveGraph();
}

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

    if(s.path.startsWith("flow/")){
        cScript.skip_list = true;
    }

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
                            
                            options.node.editCode = options.node.code;
                            editor.setValue(options.node.editCode);
                            editor.node = options.node;

                            editor.setOptions({
                                enableBasicAutocompletion: true,
                                enableSnippets: true,
                                enableLiveAutocompletion: false
                            });

                            editor.session.on('change', (delta) => {
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