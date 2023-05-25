//LiteGraph.NODE_MODES = [];

ace.require("ace/ext/language_tools");

var graph = new LGraph();
var graphCanvas = new LGraphCanvas("#mycanvas", graph);

var editorMap = {};

function codeCompile(title){

    if(editorMap[title].editor.node.code != editorMap[title].editor.node.editCode){
        new RetroNotify({
            style: 'black',
            contentText: 'Compiling ' + title + '...',
            animate: 'slideTopRight',
            closeDelay: 2000,
        });
    }
}

function codeSave(title){

}

function codeReset(title){

}

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

    //console.log(node);

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

    //avoid eval
    cScript.prototype.code = s.code;


    cScript.prototype.getMenuOptions = (canvas) => {
        return [
            {
                content: "Title",
                callback: LGraphCanvas.onShowPropertyEditor
            },
            {
                content: "View Code",
                callback: function(item, options, e, menu, node) {
                    new WinBox({
                        node: node,
                        title: node.title,
                        width: 450,
                        height: 500,
                        x: "center",
                        y: "center",
                        background: "#111",
                        html: "<div class='controls'>" +
                            "<button id=\"btn-compile-"+node.title+"\" onclick=\"codeCompile('"+node.title+"')\" class='disabled'>Compile</button>" +
                            "<button id=\"btn-save-"+node.title+"\" onclick=\"codeSave('"+node.title+"')\" class='disabled'>Save</button>" +
                            "<button id=\"btn-reset-"+node.title+"\" onclick=\"codeReset('"+node.title+"')\" class='disabled'>Reset</button>" +
                            "<span id=\"status-"+node.title+"\" class='status'>teste</span>" +
                            "</div>" +
                            "<div id=\"editor-"+node.title+"\" class=\"editor\" ></div>",
                        oncreate: (options) => {

                            let editor = ace.edit("editor-"+options.node.title);
                            editor.setTheme("ace/theme/monokai");
                            editor.session.setMode("ace/mode/javascript");
                            //console.log(node);
                            
                            options.node.editCode = options.node.code;
                            options.node.editor = editor;
                            editor.setValue(options.node.editCode);
                            editor.node = options.node;

                            editor.setOptions({
                                enableBasicAutocompletion: true,
                                enableSnippets: true,
                                enableLiveAutocompletion: false
                            });

                            editor.session.on('change', (delta) => {
                                /*
                                console.log(editor);
                                //console.log(editor.getValue() != baseCode);

                                */
                                editor.node.editCode = editor.getValue();
                                if(editor.getValue() != editor.node.code){
                                    //baseCode = editor.getValue();
                                    //socket.emit("compileCode", {code: editor.getValue(), path: editor.node.type});
                                }
                            });

                            editorMap[options.node.title] = options.node;

                        },
                    })


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