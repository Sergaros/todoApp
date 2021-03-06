const expect = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');

const {app} =  require('../server');
const {Todo} = require('../models/todo');
const {User} = require('../models/user');

const {todos, populateTodos, users, populateUsers} = require('./seed/seed')

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', ()=>{
    it('should create a new todo', (done)=>{
        let text = 'Test tot text';

        request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
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
        .set('x-auth', users[0].tokens[0].token)
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
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res)=>{
                expect(res.body.todos.length).toBe(1);
            })
            .end(done);
    });
});

describe('GET /todos/:id', ()=>{
    it('should return todo doc', (done)=>{
        request(app)
        .get(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res)=>{
            expect(res.body.todo.text).toBe(todos[0].text);
        })
        .end(done);
    });

    it('should not return todo doc created by other user', (done)=>{
        request(app)
        .get(`/todos/${todos[1]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 if todo not found', (done)=>{
        const _id = new ObjectId().toHexString();

        request(app)
        .get(`/todos/${_id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 if id not valid', (done)=>{
        request(app)
        .get(`/todos/123`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    })
});

describe('DELETE /todos/:id', ()=>{
    it('should remove a todo', done=>{
        request(app)
        .delete(`/todos/${todos[1]._id.toHexString()}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(200)
        .expect(res=>{
            expect(res.body.todo.text).toBe(todos[1].text);
        })
        .end((err, res)=>{
            if(err)
                return done(err);

            Todo.findById(todos[1]._id).then(todo=>{
                expect(todo).toBeFalsy();
                done();
            })
            .catch(e=>done(e));

        });
    });

    it('should not remove a todo created by other user', done=>{
        request(app)
        .delete(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(404)
        .end((err, res)=>{
            if(err)
                return done(err);

            Todo.findById(todos[1]._id).then(todo=>{
                expect(todo).toBeTruthy();
                done();
            })
            .catch(e=>done(e));

        });
    });

    it('should remove 404 if todo not found', done=>{
        const _id = new ObjectId().toHexString();

        request(app)
        .delete(`/todos/${_id}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should remove 404 if invalid id', done=>{
        request(app)
        .delete('/todos/123')
        .set('x-auth', users[1].tokens[0].token)
        .expect(404)
        .end(done);
    });
});

describe('PATCH /todos/:id', ()=>{
    const data = {text: 'update test text', completed: true};

    it('should update a todo', done=>{
        request(app)
        .patch(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .send(data)
        .expect(200)
        .end((err, res)=>{
            if(err)
                return done(err);

            expect(res.body.todo.text).toBe(data.text);
            expect(res.body.todo.completed).toBe(true);
            expect(typeof res.body.todo.completedAt).toBe('number');
            done();
        });
    });

    it('should not update a todo created by other user', done=>{
        request(app)
        .patch(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[1].tokens[0].token)
        .send(data)
        .expect(404)
        .end(done);
    });

    it('should clear completedAt when todo is not completed', done=>{
        request(app)
        .patch(`/todos/${todos[1]._id.toHexString()}`)
        .set('x-auth', users[1].tokens[0].token)
        .send({completed: false})
        .expect(200)
        .end((err, res)=>{
            if(err)
                return done(err);

            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toBeFalsy();
            done();
        });
    });

    it('should remove 404 if todo not found', done=>{
        const _id = new ObjectId().toHexString();

        request(app)
        .patch(`/todos/${_id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should remove 404 if invalid id', done=>{
        request(app)
        .patch('/todos/123')
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });
});

describe('GET /users/me', ()=>{
    it('should return user if authenticated', (done)=>{
        request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res)=>{
            expect(res.body._id).toBe(users[0]._id.toHexString());
            expect(res.body.email).toBe(users[0].email);
        })
        .end(done);
    });

    it('should return 401 if not authenticated', (done)=>{
        request(app)
        .get('/users/me')
        .expect(401)
        .expect((res)=>{
            expect(res.body).toEqual({})
        })
        .end(done);
    });
});

describe('POST /users', ()=>{
    const email = 'example@example.com';
    const password = '123456';

    it('should create a user', (done)=>{
        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect(res=>{
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBe(email);
            })
            .end(err=>{
                if(err)
                    return done(err);

                User.find({email})
                .then(user=>{
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password);
                    done();
                });
            });
    });

    it('should return validation errors if request invalid', (done)=>{
        request(app)
            .post('/users')
            .send({
                email: 'wrong',
                password: '111'
            })
            .expect(400)
            .end(done);
    });

    it('should not create user if email in use', (done)=>{
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: '1234567'
            })
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', ()=>{
    it('should login user and return token', done=>{
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect(res=>{
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end((err, res)=>{
                if(err)
                    return done(err);

                User.findById(users[1]._id)
                .then(user=>{
                    expect(user.toObject().tokens[1]).toMatchObject({
                        access: 'auth',
                        token: res.headers['x-auth']
                    });
                    done();
                })
                .catch(e=>done(e));
            });
    });

    it('should reject invalid login', done=>{
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: 'wrong_password'
            })
            .expect(400)
            .expect(res=>{
                expect(res.headers['x-auth']).toBeFalsy();
            })
            .end((err, res)=>{
                if(err)
                    return done(err);

                User.findById(users[1]._id)
                .then(user=>{
                    expect(user.tokens.length).toBe(1);
                    done();
                })
                .catch(e=>done(e));
            });
    });
});

describe('DELETE /users/me/token', ()=>{
    it('should remove auth token on logout', done=>{
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res)=>{
                if(err)
                    return done(err);

                return User.findById(users[0]._id)
                .then(user=>{
                    expect(user.tokens.length).toBe(0);
                    done();
                })
                .catch(e=>done(e));
            });
    });
});
