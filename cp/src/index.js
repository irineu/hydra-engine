const vm = require('node:vm');

const express = require('express')
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser')

const mongoose = require('mongoose');
const fs = require('fs');
const { resolve } = require('path');
const { readdir } = require('fs').promises;

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const server = http.createServer(app);
const io = new Server(server);

const port = 3000

let scriptDir = resolve('../scripts');
let scriptPaths = [];
let scriptObjects = [];

const ScriptSchema = new mongoose.Schema({
    name: String,
    path: String,
    inputData: [],
    outputData: [],
    inputActions: [],
    outputActions: [],
});

const BlueprintSchema =  new mongoose.Schema({
    name: String,
    nodes: [{
        node: mongoose.ObjectId,
        inputDataInUse: [],
        outputDataInUse: [],
        inputActionsInUse: [],
        outputActionsInUse: [],
    }]
});

const ScriptModel = mongoose.model('script', ScriptSchema);
const BlueprintModel = mongoose.model('blueprint', BlueprintSchema);

io.on('connection', (socket) => {
    socket.on("requestNode", (nodeName) => {
        socket.emit("updateNode", scriptObjects.find(s => s.path == nodeName));
    });

    socket.on("compileCode", (node) => {

        ScriptModel.findById(node._id).then(originalNode => {

            let parsedNode = parseScript(node);

            originalNode.inputData = parsedNode.inputData;
            originalNode.outputData = parsedNode.outputData;
            originalNode.inputActions = parsedNode.inputActions;
            originalNode.outputActions = parsedNode.outputActions;

            originalNode.save().then(()=>{

                fs.writeFileSync(scriptDir + "/" + parsedNode.path, parsedNode.code);

                socket.emit("updateNode", parsedNode);
            }).catch((e) => {
                console.log(e);
            });

            // let script = {
            //     path: objCode.path,
            //     valid: false,
            //     error: null,
            //     inputData: [],
            //     outputData: [],
            //     inputActions: [],
            //     outputActions: [],
            //     code: objCode.code
            // }
        });




    });
});

app.get('/hello', (req, res) => {
    res.send('Hello World!')
});

app.get("/blueprint", (req, res) => {
    console.log(req.query);

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
})

app.post("/blueprint/update-links", (req, res) => {
    console.log(req.body);

    BlueprintModel.findById(req.body.blueprint).then(blueprint => {
        if(!blueprint){
            res.status(404).json("blueprint not found");
        }

        let outputAction = req.body.links.filter(a => a.outputAction != undefined).map(a => a.outputAction);
        let inputAction = req.body.links.filter(a => a.inputAction != undefined).map(a => a.inputAction);

        // if(blueprint.nodes.findIndex(n => n.node == ));
        //
        // node: mongoose.ObjectId,
        // inputDataInUse: [],
        // outputDataInUse: [],
        // inputActionsInUse: [],
        // outputActionsInUse: [],

        res.json("OK");

    });
});

app.post("/node/check-usage", (req, res) => {

});

app.get('/nodes', (req, res) => {
    res.json(scriptObjects);
})

app.use(express.static('public'))
app.use('/litegraph',express.static('node_modules/litegraph.js/build'));
app.use('/litegraph',express.static('node_modules/litegraph.js/css'));

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});

function parseScript(script){

    let ctx = {module: null}

    vm.createContext(ctx)

    try{

        if(!script.code){
            script.code = fs.readFileSync(scriptDir + "/" + script.path).toString();
        }

        vm.runInContext(fs.readFileSync( "../samples/base.js"), ctx);
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

        nodes.push(node);
    });

    return nodes;
};


(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/hydra');

    let scripts = await ScriptModel.find();
    scriptObjects = await parseScripts(scripts);
})();