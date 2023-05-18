socket.on("updateNode", (node) => {

    if(node && node.path == urlParams.get("node")){

        console.log(node.valid, node.error);
        graph.clear();

        LiteGraph.clearRegisteredTypes();
        let nodeName = registerNode(node, true);

        let nodeInstance = LiteGraph.createNode(nodeName);
        nodeInstance.pos = [100,100];
        graph.add(nodeInstance);
    }
});

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

socket.emit("requestNode", urlParams.get("node"));
