ace.require("ace/ext/language_tools");

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

var snippetManager = ace.require("ace/snippets").snippetManager;
// snippetManager.insertSnippet(editor, `
// # scope: javascript
// snippet jsonssss
//     #lala;
// `);

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

editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: false
});

var baseCode = "";

socket.on("updateNode", (node) => {

    console.log(node);

    if(node && node.path == urlParams.get("node")){

        console.log(node.valid, node.error);
        graph.clear();

        LiteGraph.clearRegisteredTypes();
        let nodeName = registerNode(node, true);

        let nodeInstance = LiteGraph.createNode(nodeName);
        nodeInstance.pos = [100,100];
        graph.add(nodeInstance);
    }


    if(!baseCode){
        baseCode = node.code;
        editor.setValue(baseCode);
    }
});

editor.session.on('change', function(delta) {
    console.log(editor.getValue() != baseCode);
    if(editor.getValue() != baseCode){
        baseCode = editor.getValue();
        socket.emit("compileCode", {code: editor.getValue(), path: urlParams.get("node")});
    }
});

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

socket.emit("requestNode", urlParams.get("node"));
