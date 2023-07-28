const vm = require("node:vm");
const fs = require("fs");
const mongoose = require("mongoose");

const { resolve } = require('path');

const LiteGraph = require("litegraph.js").LiteGraph;
const LGraphNode = require("litegraph.js").LGraphNode;

let scriptDir = resolve('../scripts');
let scriptPaths = [];
const rawNodeMap = [];

const ScriptSchema = new mongoose.Schema({
    name: String,
    path: String,
    inputData: [],
    outputData: [],
    inputActions: [],
    outputActions: [],
});

const BlueprintSchema = new mongoose.Schema({
    name: String,
    nodes: [{
        node: String,
        inputDataInUse: [],
        outputDataInUse: [],
        inputActionsInUse: [],
        outputActionsInUse: [],
    }],
    graph: String,
    chain: Object
});

const ScriptModel = mongoose.model('script', ScriptSchema);
const BlueprintModel = mongoose.model('blueprint', BlueprintSchema);

function registerNode(s, registerWithError){

    let pathArr = s.path.split("\/");

    //ignore
    if(pathArr.length == 1){
        return "";
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

    rawNodeMap[s.path] = s;

    if(!s.error || (s.error && registerWithError)){
        LiteGraph.registerNodeType(s.path, cScript );
    }

    return s.path;
}

function saveNodeAndUpdate(originalNode, parsedNode, currentBlueprint, res){

    originalNode.save().then(()=>{

        let completeFilePath = (scriptDir + "/" + parsedNode.path).split("/")
        completeFilePath = completeFilePath.slice(0, completeFilePath.length - 1).join("/")

        fs.mkdirSync(completeFilePath, { recursive: true });

        console.log(parsedNode);

        fs.writeFileSync(scriptDir + "/" + parsedNode.path, parsedNode.code);

        let cachedScriptIndex = module.exports.scriptObjects.findIndex((n => n._id.toString() == originalNode._id.toString()));
        if(cachedScriptIndex > -1){
            module.exports.scriptObjects[cachedScriptIndex] = parsedNode;
        }else{
            console.error("bad reference on cache")
        }

        res.json({
            node: parsedNode,
            graph: currentBlueprint != null ? currentBlueprint.graph : null
        })
    }).catch((e) => {
        console.error(e);
        res.status(403).json("Failed to save");
    });
}
async function onCompile(req,res){
    let node = req.body.node;
    let blueprintId = req.body.blueprint;
    let currentBlueprint = null;

    ScriptModel.findById(node._id).then(async originalNode => {

        let parsedNode = parseScript(node);

        let inputActionsAddDiff = parsedNode.inputActions.filter(x => !originalNode.inputActions.includes(x));
        let inputActionsRemoveDiff = originalNode.inputActions.filter(x => !parsedNode.inputActions.includes(x));

        let outputActionsAddDiff = parsedNode.outputActions.filter(x => !originalNode.outputActions.includes(x));
        let outputActionsRemoveDiff = originalNode.outputActions.filter(x => !parsedNode.outputActions.includes(x));

        console.log("in add", inputActionsAddDiff);
        console.log("in rm", inputActionsRemoveDiff);

        console.log("out add", outputActionsAddDiff);
        console.log("out rm", outputActionsRemoveDiff);

        let diff = {
            inputActionsAddDiff, inputActionsRemoveDiff, outputActionsAddDiff,outputActionsRemoveDiff
        }

        let query = {
            nodes: {
                $elemMatch: {
                    node: node.path
                }
            }
        }

        // if validation fails, not will save
        originalNode.inputActions = parsedNode.inputActions;
        originalNode.outputActions = parsedNode.outputActions;

        originalNode.inputData = parsedNode.inputData;
        originalNode.outputData = parsedNode.outputData;

        //registerNode(originalNode);

        if(inputActionsRemoveDiff.length > 0 || outputActionsRemoveDiff.length > 0){

            BlueprintModel.find(query).then(async results => {

                if(results.length > 0){

                    //graph unlink
                    for (let i = 0; i < results.length; i++) {

                        let bp = results[i];
                        let graph = new LiteGraph.LGraph();
                        graph.configure(JSON.parse(bp.graph));

                        graph.findNodesByType(originalNode.path).forEach(inPlaceNode => {
                            for (let i = 0; i < inPlaceNode.outputs.length; i++) {
                                inPlaceNode.disconnectOutput(i);
                            }

                            for (let i = 0; i < inPlaceNode.inputs.length; i++) {
                                inPlaceNode.disconnectInput(i);
                            }
                        });

                        //TODO add new version or flag as changed

                        bp.graph = JSON.stringify(graph.serialize());

                        await saveBlueprint(bp);

                        if(blueprintId == bp._id.toString()){
                            currentBlueprint = bp;
                        }
                    }
                }

                saveNodeAndUpdate(originalNode, parsedNode, currentBlueprint, res);

            }).catch(e => {
                console.log(e)
            });
        }else{
            saveNodeAndUpdate(originalNode, parsedNode, currentBlueprint, res);
        }
    });
}

async function onCreate(req,res){
    let model = new ScriptModel({
       ...req.body
    });

    model = await model.save();

    let modelObj = model.toObject();
    modelObj.code = req.body.code;

    module.exports.scriptObjects.push(parseScript(modelObj));

    saveNodeAndUpdate(model, modelObj, null, res);
}


async function saveBlueprint(blueprint){

    let graph = new LiteGraph.LGraph();
    graph.configure(JSON.parse(blueprint.graph));

    blueprint.nodes = [];

    graph._nodes.forEach(node =>{

        let inNodes = node.inputs.filter(i => i.link != null).map(i => i.name);
        let outNodes = node.outputs.filter(o => o.links != null && o.links.length > 0).map(o => o.name);

        let bpNode = {
            node : node.type,
            inputDataInUse: [],
            outputDataInUse: [],
            inputActionsInUse:  [],
            outputActionsInUse: []
        }

        inNodes.forEach(n => {
            if(bpNode.inputActionsInUse.indexOf(n) == -1){
                bpNode.inputActionsInUse.push(n);
            }
        });

        outNodes.forEach(n => {
            if(bpNode.outputActionsInUse.indexOf(n) == -1){
                bpNode.outputActionsInUse.push(n);
            }
        });

        blueprint.nodes.push(bpNode);
    });

    blueprint.chain = generateChain(graph);

    await blueprint.save();
    return blueprint;
}

async function onSaveBlueprint(req,res){
    let blueprint = await BlueprintModel.findById(req.body.blueprint);
    if(blueprint){
        blueprint.graph = req.body.graph;
        await saveBlueprint(blueprint);
        res.json("OK");
    }else{
        res.status(404).json("NOK");
    }
}

function updateLinks(req,res){
    BlueprintModel.findById(req.body.blueprint).then(blueprint => {
        if(!blueprint){
            res.status(404).json("blueprint not found");
        }

        if(req.body.mode == "connect"){
            req.body.links.forEach(l => {
                let index = blueprint.nodes.findIndex(n => n.node.toString() == l.type);

                if (index == -1){

                    console.log("adding node", l.type);

                    blueprint.nodes.push({
                        node : l.type,
                        inputDataInUse: [],
                        outputDataInUse: [],
                        inputActionsInUse:  l.inputAction == undefined ? [] : [l.inputAction],
                        outputActionsInUse: l.outputAction == undefined ? [] : [l.outputAction]
                    });
                }else{
                    if(l.inputAction != undefined){
                        blueprint.nodes[index].inputActionsInUse.push(l.inputAction);
                    }

                    if(l.outputAction != undefined){
                        blueprint.nodes[index].outputActionsInUse.push(l.outputAction);
                    }
                }
            });
        }else{
            req.body.links.forEach(l => {
                let index = blueprint.nodes.findIndex(n => n.node.toString() == l.type);
                console.log("remove node", index);
                if (index != -1){

                    if(l.inputAction){
                        let nindex = blueprint.nodes[index].inputActionsInUse.indexOf(l.inputAction);
                        console.log(nindex);
                        if(nindex > -1){
                            blueprint.nodes[index].inputActionsInUse.splice(nindex, 1);
                        }

                    }

                    if(l.outputAction){
                        let nindex = blueprint.nodes[index].outputActionsInUse.indexOf(l.outputAction);
                        console.log(nindex);
                        if(nindex > -1){
                            blueprint.nodes[index].outputActionsInUse.splice(nindex, 1);
                        }
                    }
                }
            });
        }

        blueprint.save().then(() =>{
            res.json("OK");
        });

    });
}

function parseScript(script){

    let ctx = {module: null}

    vm.createContext(ctx)

    try{

        if(!script.code){
            script.code = fs.readFileSync(scriptDir + "/" + script.path).toString();
        }

        vm.runInContext(fs.readFileSync( "../samples/base_oc.js"), ctx);
        vm.runInContext(script.code, ctx);

        if(ctx.module.toString().startsWith("class") && typeof ctx.module == "function"){
            script.valid = true;

            //console.log(Object.getOwnPropertyNames(ctx.module.prototype));
            //console.log(ctx.module.prototype);

            vm.runInContext("try{ new module() } catch(e) { error = e }", ctx);

            if(ctx.error){
                script.valid = false;
                script.error = ctx.error.toString();
                console.log(ctx.error.toString());
            }else{
                if(Array.isArray(ctx.inputData)){
                    script.inputData = ctx.inputData;
                }

                if(Array.isArray(ctx.outputData)){
                    script.outputData = ctx.outputData;
                }

                if(Array.isArray(ctx.inputActions)){
                    script.inputActions = ctx.inputActions.filter(f => typeof f == 'function' && f.length == 1).map( f => f.name);
                }

                if(Array.isArray(ctx.outputActions)){
                    script.outputActions = ctx.outputActions.filter(f => typeof f == 'string');
                }
            }
        }
    }catch(e){
        //console.log("script error", e);
        script.valid = false;
    }

    return script;
}

async function parseScripts(scriptEntities){

    let nodes = [];

    scriptEntities.forEach(se =>{

        let script = {
            _id: se._id,
            path: se.path,
            valid: false,
            error: null,
            inputData: [],
            outputData: [],
            inputActions: [],
            outputActions: [],
            code: null
        }

        let node = parseScript(script);

        if(!(JSON.stringify(script.inputData) == JSON.stringify(se.inputData))) {
            console.error("inputData inconsistent");
        }

        if(!(JSON.stringify(script.outputData) == JSON.stringify(se.outputData))) {
            console.error("outputData inconsistent");
        }

        if(!(JSON.stringify(script.inputActions) == JSON.stringify(se.inputActions))) {
            console.error("inputActions inconsistent");
        }

        if(!(JSON.stringify(script.outputActions) == JSON.stringify(se.outputActions))) {
            console.error("outputActions inconsistent");
        }

        let name = registerNode(node);

        nodes.push(node);
    });

    return nodes;
};

function onGetBlueprint(req,res){
    let name = req.query.name;

    if(!name){
        return res.status(400).json("Name not defined");
    }

    BlueprintModel.findOne({name : name}).then(blueprint => {

        if(!blueprint){
            blueprint = new BlueprintModel({name: name});
            blueprint.save().then(() => {
                return res.json(blueprint);
            });
        }else{
            return res.json(blueprint);
        }


    });
}

function recursiveGraph(node, graph){

    let chainNode = {};

    for (let i = 0; i < node.outputs.length; i++) {
        if(node.outputs[i].links != null && node.outputs[i].links.length > 0 && node.outputs[i].type == LiteGraph.ACTION){
            let linkId = node.outputs[i].links[0];
            let key = node.outputs[i].name;

            let next = graph.getNodeById(graph.links[linkId].target_id);

            chainNode[key] = {
                graphId: next.id,
                type: next.type,
                input: graph.getNodeById(graph.links[linkId].target_id).inputs[graph.links[linkId].target_slot].name,
                output: recursiveGraph(next, graph)
            }
        }
    }

    return chainNode;

}

function generateChain(graph){
    let originNode = graph._nodes[graph._nodes.findIndex(n => n.type.startsWith("flow"))]
    //originNode.triggerSlot(0)

    let result = {}
    result.type = originNode.type;
    result.output = recursiveGraph(originNode, graph);
    //console.log(result);
    //graph.links

    return result;
}

async function setup(){
    let scripts = await ScriptModel.find();
    module.exports.scriptObjects = await parseScripts(scripts);
}


module.exports = {
    setup: setup,
    updateLinks: updateLinks,
    onSaveBlueprint: onSaveBlueprint,
    onCompile: onCompile,
    onCreate: onCreate,
    onGetBlueprint: onGetBlueprint,
    scriptObjects: []
}