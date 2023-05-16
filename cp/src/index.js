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

let scripts = [];

io.on('connection', (socket) => {
    console.log('a user connected');
})

app.get('/hello', (req, res) => {
    res.send('Hello World!')
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

let scriptDir = resolve('../scripts');
let scriptPaths = [];
let scriptObjects = [];


async function parseScripts(){

    let so = [];

    scriptPaths.forEach(sp =>{

        let script = {
            path: sp,
            valid: false,
            inputData: [],
            outputData: [],
            inputActions: [],
            outputActions: [],
        }

        let ctx = {module: null}

        vm.createContext(ctx)

        try{
            vm.runInContext(fs.readFileSync( "../samples/base.js"), ctx);
            vm.runInContext(fs.readFileSync(scriptDir + "/" + sp), ctx);

            if(ctx.module.toString().startsWith("class") && typeof ctx.module == "function"){
                script.valid = true;

                console.log(Object.getOwnPropertyNames(ctx.module.prototype));
                console.log(ctx.module.prototype);

                vm.runInContext("new module()", ctx);

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
                    script.outputActions = ctx.outputActions.filter(f => typeof f == 'function' && f.length == 1).map( f => f.name);
                }

            }
        }catch(e){
            //console.log("script error", e);
        }

        so.push(script);
    });

    return so;
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

    console.log(scriptObjects)
})();