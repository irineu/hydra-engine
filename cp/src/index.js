const vm = require('node:vm');

const express = require('express')
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser')

const scripts = require("./script");

const mongoose = require('mongoose');

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const server = http.createServer(app);
const io = new Server(server);

const port = 3000

app.get('/hello', (req, res) => {
    res.send('Hello World!')
});

app.get("/blueprint", (req, res) => {
    scripts.onGetBlueprint(req,res);
});

app.post("/node/compile", async (req, res) => {
    scripts.onCompile(req,res);
})

app.post("/blueprint/save", async (req, res) => {
    scripts.onSaveBlueprint(req,res)
});

app.post("/blueprint/update-links", (req, res) => {
    scripts.updateLinks(req,res)
});

app.get('/nodes', (req, res) => {
    res.json(scripts.scriptObjects);
})

app.use(express.static('public'))
app.use('/litegraph',express.static('node_modules/litegraph.js/build'));
app.use('/litegraph',express.static('node_modules/litegraph.js/css'));

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});

(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/hydra');

    scripts.setup();
})();