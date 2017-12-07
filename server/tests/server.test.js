const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Todo} = require('../models/todo');
const {User} = require('../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

// Wipe all data on db before the tests run
beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('create a new todo', (done) => {
    let text = 'Test a todo text';

    request(app)
    .post('/todos')
    .send({text})
    .expect(200)
    .expect((res) => {
      expect(res.body.text).toBe(text);
    })
    .end((err, res) => {
      if (err) {
        return done(err);
      }
      Todo.find({text}).then((todos) => {
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
        done();
      }).catch((e) => done(e));
    });
  });

  it('dont create todo with invalid data', (done) => {

    request(app)
    .post('/todos')
    .send({})
    .expect(400)
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      Todo.find().then((todos) => {
        expect(todos.length).toBe(2);
        done();
      }).catch((e) => done(e));
    });
  });
});

describe('GET /todos', () => {
  it('get all todos', (done) => {
    request(app)
    .get('/todos')
    .expect(200)
    .expect((res) => {
      expect(res.body.todos.length).toBe(2);
    }).end(done);
  });
});

describe('GET /todos/:id', () => {
  it('return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });

  it('return a 404 if todo not found', (done) => {
    request(app)
    .get(`/todos/${new ObjectID().toHexString()}`)
    .expect(404)
    .end(done);
  });

  it('return 404 for invalid object ids', (done) => {
    request(app)
    .get(`/todos/notvalidid`)
    .expect(404)
    .end(done);
  });
});

describe('DELETE /todos/:id', () => {
    it('remove a todo', (done) => {
      var hexId = todos[1]._id.toHexString();

      request(app)
      .delete(`/todos/${hexId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.findById(hexId).then((todo) => {
          expect(todo).toNotExist();
          done();
        }).catch((e) => done(e));
      });
    });

    it('return 404 if todo not found', (done) => {
      request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .expect(404)
      .end(done);
    });

    it('return 404 if object id is invalid', (done) => {
      request(app)
      .get(`/todos/abc`)
      .expect(404)
      .end(done);
    });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    var hexId = todos[0]._id.toHexString();
    var text = 'I updated this text, nailed IT!';
    var completed = true;

    request(app)
    .patch(`/todos/${hexId}`)
    .send({text, completed})
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(hexId);
    })
    .end((err, res) => {
      if (err) {
        return done(err);
      }
      Todo.findById(hexId).then((todo) => {
        expect(todo.text).toBe(text);
        expect(todo.completed).toBe(completed);
        expect(todo.completedAt).toBeA('number');
        done();
      }).catch((e) => done(e));
    });
  });

  it('should clear completedAt when todo is not completed', (done) => {
    var hexId = todos[1]._id.toHexString();
    var text = 'I updated this text, nailed IT!';
    var completed = false;

    request(app)
    .patch(`/todos/${hexId}`)
    .send({text, completed})
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(hexId);
    })
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      Todo.findById(hexId).then((todo) => {
        expect(todo.text).toBe(text);
        expect(todo.completed).toBe(false);
        expect(todo.completedAt).toNotExist();
        done();
      }).catch((e) => done(e));
    });
  });
});

describe('GET /users/me', () => {
  it('return a user object if user is authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body._id).toBe(users[0]._id.toHexString());
      expect(res.body.email).toBe(users[0].email);
    })
    .end(done);
  });

  it('return a 401 if not authenticated', (done) => {
    request(app)
    .get('/users/me')
    .expect(401)
    .expect((res) => {
      expect(res.body).toEqual({});
    })
    .end(done);
  });
});

describe('POST /users', (done) => {
  it('create a user', (done) => {
    var email = 'ana@example.com';
    var password = 'moj@os';

    request(app)
    .post('/users')
    .send({email, password})
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toExist();
      expect(res.body._id).toExist();
      expect(res.body.email).toBe(email);
    })
    .end((err) => {
      if (err) {
        return done(err);
      }

      User.findOne({email}).then((user) => {
        expect(user).toExist();
        expect(user.password).toNotBe(password);
        done();
      }).catch((e) => done(e));
    });
  });

  it('return validation erros if request is invalid', (done) => {
    var email = 'invalidemail.com';
    var password = 'asdfg';

    request(app)
    .post('/users')
    .send({email, password})
    .expect(400)
    .end(done);
  });

  it('don\'t create user if email is in use', (done) => {
    var email = users[0].email;
    var password = 'aposdkflaps';
    request(app)
    .post('/users')
    .send({email, password})
    .expect(400)
    .end(done);
  });
});

describe('POST /users/login', (done) => {
  it('login user and return auth token', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password
    })
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toExist();
    })
    .end((err, res) => {
      if(err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens[0]).toInclude({
          access: 'auth',
          token: res.headers['x-auth']
        });
        done();
      }).catch((e) => done(e));
    });
  });

  it('reject invalid login', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: 'invalidpassword'
    })
    .expect(400)
    .expect((res) => {
      expect(res.headers['x-auth']).toNotExist();
    })
    .end((err, res) => {
      if(err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(0);
        done();
      }).catch((e) => done(e));
    });
  });
});
