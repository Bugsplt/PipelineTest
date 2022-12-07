const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json({
    limit: '12mb',
}));
app.use(express.static(__dirname + '/'));
app.set('view engine', 'html');
app.set('views', __dirname);
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});


app.use(bodyParser.urlencoded({extended: true, limit: '12mb'}));

app.get('/testPage', function (req, res) {
    res.sendFile(__dirname + "/TestPage.html");
});
