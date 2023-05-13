const express = require('express')
const app = express()
const port = 3000

app.get('/hello', (req, res) => {
    res.send('Hello World!')
})

app.use(express.static('public'))
app.use('/litegraph',express.static('node_modules/litegraph.js/build'));
app.use('/litegraph',express.static('node_modules/litegraph.js/css'));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})