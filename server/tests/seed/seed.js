const {ObjectId} = require('mongodb');
const {Todo} = require('../../models/todo');
const {User} = require('../../models/user');
const jwt = require('jsonwebtoken');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();

const users = [{
    _id: userOneId,
    email: 'usr1@gmail.com',
    password: '123456usr1',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId.toHexString(), access: 'auth'}, 'abc123').toString()
    }]
},{
    _id: userTwoId,
    email: 'usr2@gmail.com',
    password: '123456usr2',
}];

const todos = [{
    _id: new ObjectId(),
    text: 'First test todo'
},
{
    _id: new ObjectId(),
    text: 'Second test todo',
    completed: true,
    completedAt: 333
}];

const populateTodos = (done)=>{
    Todo.remove({})
    .then(()=>{
        return Todo.insertMany(todos)
    }).then(()=>done());
};

const populateUsers = (done)=>{
    User.remove({})
    .then(()=>{
        let userOne = new User(users[0]).save();
        let userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo]);
    }).then(()=>done());
};

module.exports = {todos, populateTodos, users, populateUsers};