//LiteGraph.NODE_MODES = [];

var graph = new LGraph();
var graphCanvas = new LGraphCanvas("#mycanvas", graph);

var node_const = LiteGraph.createNode("flow/HTTPHandler");
node_const.pos = [200,200];
graph.add(node_const);
node_const.id = 1;
//node_const.setValue(4.5);

var node_watch = LiteGraph.createNode("transactions/authTransMap");
node_watch.pos = [700,200];
graph.add(node_watch);
node_watch.id = 2;
//node_const.connect(0, node_watch, 0 );

//graph.start()

function updateEditorHiPPICanvas() {
    const ratio = window.devicePixelRatio;
    if(ratio == 1) { return }
    let canvas = document.getElementById("mycanvas");
    const rect = canvas.parentNode.getBoundingClientRect();
    const { width, height } = rect;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.getContext("2d").scale(ratio, ratio);
    return canvas;
}


window.graphcanvas = graphCanvas;
window.graph = graph;
updateEditorHiPPICanvas();
window.addEventListener("resize", function() {
    graphcanvas.resize();
    updateEditorHiPPICanvas();
} );

var socket = io();
//graph.getNodeById(1).triggerSlot(0);