const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(3456);
console.log('Listening on port 3456!');
