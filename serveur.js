const express = require('express');
const Joi = require("joi");
const app = express();

const Collection = require("./Collection");
const Tasks = new Collection("Tasks");

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.get('/taches', (req, res) => {
	res.json(Tasks.getAll());
});

app.get('/taches/:id', (req, res) => {
    let id = req.params.id;
    res.json(Tasks.getOne(id));
})



app.listen(3000);