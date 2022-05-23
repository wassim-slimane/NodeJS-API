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

app.post('/taches', (req, res) => {

    const payload = req.body;
    const schema = Joi.object({
        description: Joi.string().min(3).max(50).required(),
        faite: Joi.boolean().required(),
    });

    const { value: task, error } = schema.validate(payload);
    if (error) return res.status(400).send({ erreur: error.details[0].message });

    Tasks.insertOne(task);
    
    res.status(201).json({
        description: task.description,
        faite: task.faite,
        message: "La tâche à bien été enregistrée",
        status: "201"
    });
});

app.put('/taches/:id', (req, res) => {
    let id = req.params.id;
    const payload = req.body;
    const schema = Joi.object({
        description: Joi.string().min(3).max(50).required(),
        faite: Joi.boolean().required(),
    });
    const { value: task, error } = schema.validate(payload);
    if (error) return res.status(400).send({ erreur: error.details[0].message });

    Tasks.updateOne(id, task);
    
    res.status(201).json({
        description: task.description,
        faite: task.faite,
        message: "La tâche à bien été modifié",
        status: "201"
    });
})

app.listen(3000);