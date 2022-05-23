const express = require('express');
const Joi = require("joi");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();
if (!process.env.JWT_PRIVATE_KEY) {
  console.log(
    "Vous devez créer un fichier .env qui contient la variable JWT_PRIVATE_KEY"
  );
  process.exit(1);
}

const Collection = require("./Collection");
const Tasks = new Collection("Tasks");
const Accounts = new Collection("Accounts");

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

    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({erreur: "Vous devez vous connecter"})

    try{
        jwt.verify(token, process.env.JWT_PRIVATE_KEY)
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
    } catch (exc) {
        res.status(401).json({
            message: "Impossible de se connecter vous n'êtes pas authentifié"
        })
    }
});

app.put('/taches/:id', (req, res) => {

    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({erreur: "Vous devez vous connecter"})

    try{
        jwt.verify(token, process.env.JWT_PRIVATE_KEY)
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
    } catch (exc) {
        res.status(401).json({
            message: "Impossible de se connecter vous n'êtes pas authentifié"
        })
    }
})

app.delete('/taches/:id', (req, res) => {
    let id = req.params.id;
    
    Tasks.deleteOne(id);
    
    res.status(201).json({
        message: "Object deleted"
    });
})

// INSCRIPTION
app.post("/signup", async (req, res) => {
  const payload = req.body;
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().max(255).required().email(),
    motdepasse: Joi.string().min(3).max(50).required(),
  });

  const { value: account, error } = schema.validate(payload);
  if (error) return res.status(400).send({ erreur: error.details[0].message });
  const { id, found } = Accounts.findByProperty("email", account.email);
  if (found) return res.status(400).send("Please signin instead of signup");
  const salt = await bcrypt.genSalt(10);
  const passwordHashed = await bcrypt.hash(account.motdepasse, salt);
  account.motdepasse = passwordHashed;

  Accounts.insertOne(account);
  res.status(201).json({
    username: account.username,
    email: account.email,
  });
});

app.post("/signin", async (req, res) => {
  const payload = req.body;
  const schema = Joi.object({
    email: Joi.string().max(255).required().email(),
    motdepasse: Joi.string().min(3).max(50).required(),
  });

  const { value: connexion, error } = schema.validate(payload);

  if (error) return res.status(400).send({ erreur: error.details[0].message });

  const { id, found: account } = Accounts.findByProperty(
    "email",
    connexion.email
  );
  if (!account) return res.status(400).send({ erreur: "Email Invalide" });

  const passwordIsValid = await bcrypt.compare(req.body.motdepasse, account.motdepasse);
  if (!passwordIsValid)
    return res.status(400).send({ erreur: "Mot de Passe Invalide" });

  const token = jwt.sign({ id }, process.env.JWT_PRIVATE_KEY);
  res.header("x-auth-token", token).status(200).send({ name: account.name });
});

app.listen(3000);