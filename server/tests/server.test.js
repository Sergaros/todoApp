const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');

const {app} =  require('../server');
const {Todo} = require('../models/todo');

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

beforeEach(done=>{
    Todo.remove({})
    .then(()=>{
        return Todo.insertMany(todos)
    }).then(()=>done());
});

describe('POST /todos', ()=>{
    it('should create a new todo', (done)=>{
        let text = 'Test tot text';

        request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect((res)=>{
            expect(res.body.text).toBe(text);
        })
        .end((err, res)=>{
            if(err)
                return done(err);

            Todo.find({text}).then(todos=>{
                expect(todos.length).toBe(1);
                expect(todos[0].text).toBe(text);
                done();
            })
            .catch(e=>done(e));
        });
    });

    it('should not create todo with invalid body data', (done)=>{
        request(app)
        .post('/todos')
        .send({})
        .expect(400)
        .end((err, res)=>{
            if(err)
                return done(err);

            Todo.find().then(todos=>{
                expect(todos.length).toBe(2);
                done();
            })
            .catch(e=>done(e));
        });
    });

});

describe('GET /totods', ()=>{
    it('should get all todos', (done)=>{
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res)=>{
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', ()=>{
    it('should return todo doc', (done)=>{
        request(app)
        .get(`/todos/${todos[0]._id.toHexString()}`)
        .expect(200)
        .expect((res)=>{
            expect(res.body.todo.text).toBe(todos[0].text);
        })
        .end(done);
    });

    it('should return 404 if todo not found', (done)=>{
        const _id = new ObjectId().toHexString();

        request(app)
        .get(`/todos/${_id}`)
        .expect(404)
        .end(done);
    });

    it('should return 404 if id not valid', (done)=>{
        request(app)
        .get(`/todos/123`)
        .expect(404)
        .end(done);
    })
});

describe('DELETE /todos/:id', ()=>{
    it('should remove a todo', done=>{
        request(app)
        .delete(`/todos/${todos[1]._id.toHexString()}`)
        .expect(200)
        .expect(res=>{
            expect(res.body.todo.text).toBe(todos[1].text);
        })
        .end((err, res)=>{
            if(err)
                return done(err);

            Todo.findById(todos[1]._id).then(todo=>{
                expect(todo).toNotExist();
                done();
            })
            .catch(e=>done(e));

        });
    });

    it('should remove 404 if todo not found', done=>{
        const _id = new ObjectId().toHexString();

        request(app)
        .delete(`/todos/${_id}`)
        .expect(404)
        .end(done);
    });

    it('should remove 404 if invalid id', done=>{
        request(app)
        .delete('/todos/123')
        .expect(404)
        .end(done);
    });
});

describe('PATCH /todos/:id', ()=>{
    const data = {text: 'update test text', completed: true};

    it('should update a todo', done=>{
        request(app)
        .patch(`/todos/${todos[0]._id.toHexString()}`)
        .send(data)
        .expect(200)
        .end((err, res)=>{
            if(err)
                return done(err);

            expect(res.body.todo.text).toBe(data.text);
            expect(res.body.todo.completed).toBe(true);
            expect(res.body.todo.completedAt).toBeA('number');
            done();
        });
    });

    it('should clear completedAt when todo is not completed', done=>{
        request(app)
        .patch(`/todos/${todos[1]._id.toHexString()}`)
        .send({completed: false})
        .expect(200)
        .end((err, res)=>{
            if(err)
                return done(err);

            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toNotExist();
            done();
        });
    });

    it('should remove 404 if todo not found', done=>{
        const _id = new ObjectId().toHexString();

        request(app)
        .patch(`/todos/${_id}`)
        .expect(404)
        .end(done);
    });

    it('should remove 404 if invalid id', done=>{
        request(app)
        .patch('/todos/123')
        .expect(404)
        .end(done);
    });
});

/*describe('GET /users/me', ()=>{
    it('should return user if authenticated', (done)=>{
        request(app)
        .get('users/me')
        .set('x-auth', )
    });

    it('should return 401 if not authenticated', (done)=>{

    });
});*/
