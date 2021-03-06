require('./config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const authenticate = require('./middleware/athenticate');

const {ObjectId} = require('mongodb');

const app = express();
//const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', authenticate, (req,res)=>{
    Todo.find({_creator: req.user._id})
    .then((todos)=>{
        res.send({todos});
    }, (e)=>{
        res.status(400).send(e);
    });
});

app.get('/todos/:id', authenticate, (req,res)=>{
    let id = req.params.id;

    if(!ObjectId.isValid(id))
        return res.status(404).send('invalid id');

    Todo.findOne({
        _id: id,
        _creator: req.user._id
    })
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

app.delete('/todos/:id', authenticate, (req,res)=>{

    if(!ObjectId.isValid(req.params.id))
        return res.status(404).send('invalid id');

    Todo.findOneAndRemove({
        _id: req.params.id,
         _creator: req.user._id
     })
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

app.patch('/todos/:id', authenticate, (req, res)=>{
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

    Todo.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set:body}, {new: true})
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

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password)
    .then(user=>{
        user.generateAuthToken().then(token=>{
            res.header('x-auth', token).send(user);
        });
    })
    .catch(e=>{
        return res.status(400).send('not found');
    });
});

app.get('/users/me', authenticate, (req, res)=>{
    res.send(req.user);
});

app.delete('/users/me/token', authenticate, (req, res)=>{
    req.user.removeToken(req.token)
    .then(()=>{
        res.status(200).send();
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
