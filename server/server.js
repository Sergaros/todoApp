require('./config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

const {ObjectId} = require('mongodb');

const app = express();
//const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', (req,res)=>{
    Todo.find()
    .then((todos)=>{
        res.send({todos});
    }, (e)=>{
        res.status(400).send(e);
    });
});

app.get('/todos/:id', (req,res)=>{

    if(!ObjectId.isValid(req.params.id))
        return res.status(404).send('invalid id');

    Todo.findById(req.params.id)
    .then(todo=>{
        if(!todo)
            return res.status(404).send('not found');
        else
            res.send({todo});
    })
    .catch(e=>{
        res.status(400).send(e);
    });
});

app.delete('/todos/:id', (req,res)=>{

    if(!ObjectId.isValid(req.params.id))
        return res.status(404).send('invalid id');

    Todo.findByIdAndRemove(req.params.id)
    .then(todo=>{
        if(!todo)
            return res.status(404).send('not found');
        else
            res.send({todo});
    })
    .catch(e=>{
        res.status(400).send(e);
    });
});

app.patch('/todos/:id', (req, res)=>{
    const id = req.params.id;

    if(!ObjectId.isValid(id))
        return res.status(404).send('invalid id');

    const body = _.pick(req.body, ['text', 'completed']);

    if(_.isBoolean(body.completed) && body.completed)
        body.completedAt = new Date().getTime();
    else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {$set:body}, {new: true})
    .then(todo=>{
        if(!todo)
            return res.status(404).send('not found');

        res.send({todo});
    })
    .catch(e=>res.status(400).send(e));
});

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);

    user.save().then((result) => {
        return result.generateAuthToken();
    })
    .then(token=>{
        res.header('x-auth', token).send(user);
    })
    .catch(e=>{
        res.status(400).send(e);
    });
});

if(require.main === module){
    app.listen(process.env.PORT, () => {
      console.log(`Started on port ${process.env.PORT}`);
    });
} else {
    module.exports = {app};
}
