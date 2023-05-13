//node constructor class

function MyAddNode()
{
    // this.addInput("A","number");
    // this.addInput("B","number");
    // this.addOutput("A+B","number");
    this.properties = { precision: 1 };

    this.addInput("play", LiteGraph.ACTION );
    this.addInput("xpoto", LiteGraph.EVENT );
    this.addOutput("A+B2",LiteGraph.EVENT);
    this.addOutput("AA+B2",LiteGraph.EVENT);
}

//name to show
MyAddNode.title = "Sum";

//function to call when the node is executed
MyAddNode.prototype.onExecute = function()
{
    console.log("exec");

    // var A = this.getInputData(0);
    // if( A === undefined )
    //     A = 0;
    // var B = this.getInputData(1);
    // if( B === undefined )
    //     B = 0;
    // this.setOutputData( 0, A + B );
}

MyAddNode.prototype.onAction = function(action, data)
{
    console.log("action:",action);

    setTimeout(()=>{
        this.triggerSlot(0);
    },3000);
}

MyAddNode.prototype.onTrigger = function(action, data)
{
    console.log("trig:", action);
}


MyAddNode.prototype.onConnectOutput = function (slot, input_type, input, target_node, target_slot) {

    // console.log(slot);
    // console.log(this.getOutputNodes(slot));

    if(this.getOutputNodes(slot)){
        this.disconnectOutput(slot);
    }
}

//new LGraphNode().disconnectOutput()

//register in the system
LiteGraph.registerNodeType("basic/sum", MyAddNode );