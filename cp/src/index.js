const vm = require('node:vm');

const express = require('express')
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const { resolve } = require('path');
const { readdir } = require('fs').promises;

const app = express()
const server = http.createServer(app);
const io = new Server(server);

const port = 3000

let scriptDir = resolve('../scripts');
let scriptPaths = [];
let scriptObjects = [];


io.on('connection', (socket) => {
    socket.on("requestNode", (nodeName) => {
        socket.emit("updateNode", scriptObjects.find(s => s.path == nodeName));
    });

    socket.on("compileCode", (objCode) => {

        let script = {
            path: objCode.path,
            valid: false,
            error: null,
            inputData: [],
            outputData: [],
            inputActions: [],
            outputActions: [],
            code: objCode.code
        }

        socket.emit("updateNode", parseScript(script));
    });


});



app.get('/hello', (req, res) => {
    res.send('Hello World!')
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


async function getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

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
                    console.log(ctx.outputActions)
                    script.outputActions = ctx.outputActions.filter(f => typeof f == 'string');
                }
            }
        }
    }catch(e){
        //console.log("script error", e);
    }

    return script;
}

async function parseScripts(){

    let nodes = [];

    scriptPaths.forEach(sp =>{

        let script = {
            path: sp,
            valid: false,
            error: null,
            inputData: [],
            outputData: [],
            inputActions: [],
            outputActions: [],
            code: null
        }
        let node = parseScript(script);

        nodes.push(node);
    });

    return nodes;
};

const fwatchListener = async (eventType, filePath) => {

    if(filePath.endsWith("~")){
        return;
    }

    try {
        if (fs.existsSync(scriptDir + "/" + filePath)) {
            if(scriptPaths.indexOf(filePath) == -1){
                console.log("File Added!");
            }else{
                console.log("File Changed!");
            }
        }else{
            console.log("file Removed! " + filePath);
        }
    } catch(err) {
        console.error(err)
    }

    scriptPaths = await loadFiles();
    scriptObjects = await parseScripts();

    scriptObjects.forEach(s => {
        io.emit("updateNode", s);
    });

};

async function loadFiles(){
    try{
        let files = await getFiles(scriptDir);

        files = files.map(p => {
            let np = p.substring(scriptDir.length + 1);
            return np;
        });

        return files;
    }catch(e){
        console.error(e);
    }
}

(async () => {
    fs.watch(scriptDir + "/",{recursive: true}, fwatchListener);

    scriptPaths = await loadFiles();
    scriptObjects = await parseScripts();

    //console.log(scriptObjects)
})();