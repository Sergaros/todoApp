const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

const {ObjectId} = require('mongodb');

const app = express();

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

if(require.main === module){
    app.listen(3000, () => {
      console.log('Started on port 3000');
    });
} else {
    module.exports = {app};
}
