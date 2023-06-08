ace.require("ace/ext/language_tools");

var graph = new LGraph();
var graphCanvas = new LGraphCanvas("#mycanvas", graph);

var editorMap = {};
var windowMap = {};
var rawNodeMap = {};
let blueprint = null;
let saveTimeout = -1;


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

            if(response.status == 400){

                new RetroNotify({
                    style: 'red',
                    contentText: 'Failed to compile ' + editorMap[type].node.title + '!',
                    animate: 'slideTopRight',
                    closeDelay: 2000,
                });

                alert("The following blueprints: " + result.restrictions.map(r => r.name).join(", ") + " are using that link. Please remove them first before save.")
            }else {
                let result = await response.json();
                onUpdateNode(result);
            }
        });
    }
}

function connectionsChange( type, slot, connected, link_info, input_info){
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveGraph, 2000);
}

function saveGraph(){

    fetch("blueprint/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            blueprint: blueprint._id,
            graph: JSON.stringify(graph.serialize())
        })
    }).then(async response => {
        // new RetroNotify({
        //     style: 'black',
        //     contentText: 'Blueprint saved!',
        //     animate: 'slideTopRight',
        //     closeDelay: 2000,
        // });
    })
}

function resizeInPlaceNodes(registerName){
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
}

function onUpdateNode (response) {

    let node = response.node;

    console.log(node.valid, node.error);

    let gnode = graph._nodes.find(n => n.type == node.path);

    if(!node.valid){
        document.getElementById("status-"+gnode.title).textContent = "Failed to compile!";
        return;
    }else{
        document.getElementById("status-"+gnode.title).textContent = "";
        windowMap[node.path].setTitle(gnode.title);
    }

    let registerName = registerNode(node, true);

    if(response.graph){
        graph.configure(JSON.parse(response.graph));
    }

    //resize
    resizeInPlaceNodes(registerName);

    if(editorMap[node.path].node.code != node.code){
        editorMap[node.path].node.code = node.code;
        document.getElementById("btn-compile-" + editorMap[node.path].node.title).classList.add("disabled");
    }
}

function registerNode(s, registerWithError){

    let pathArr = s.path.split("\/");

    if(pathArr.length == 1){
        return null;
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

    if(!s.error || (s.error && registerWithError)){
        LiteGraph.registerNodeType(s.path, cScript );
    }

    return s.path;
}

///

LiteGraph.clearRegisteredTypes();

fetch("nodes").then(async response => {
    let scripts = await response.json();
    scripts.forEach((s) => {
        registerNode(s, false);
    });

    fetch("blueprint?name=main").then(async response => {
        blueprint = await response.json();
        graph.configure(JSON.parse(blueprint.graph));
    });

});


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


///

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