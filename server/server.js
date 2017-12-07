require('./config/config');
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');

var {ObjectID} = require('mongodb');
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });
  todo.save().then((doc) => {
    res.send(doc);
  }, (err) => {
    res.status(400).send({});
  });
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({todos});
  }, (err) => {
    res.status(400).send({});
  });
});

app.get('/todos/:id', (req, res) => {
  var _id = req.params.id;
  if(ObjectID.isValid(_id)) {
    Todo.findById(_id).then((todo) => {
      if(!todo) {
        return res.status(404).send({});
      }
      res.send({todo});
    }).catch((e) => res.status(400).send({}));
  } else {
    res.status(404).send({});
  }
});

app.delete('/todos/:id', (req, res) => {
  var _id = req.params.id;
  if(!ObjectID.isValid(_id)) {
    return res.status(404).send({});
  }

  Todo.findByIdAndRemove(_id).then((todo) => {
    if(!todo) {
      return res.status(404).send({});
    }
    res.status(200).send({todo});

  }).catch((err) => res.status(400).send({}));
});

app.patch('/todos/:id', (req, res) => {
  var _id = req.params.id;
  // get only the params we want
  var body = _.pick(req.body, ['text', 'completed']);

  if(!ObjectID.isValid(_id)) {
    return res.status(404).send({});
  }

  if(_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(_id, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send({});
    }
    return res.send({todo});

  }).catch((e) => {
    res.status(400).send();
  });
});

// POST /users
app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  // user.generateAuthToken

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((err) => res.status(400).send(err));
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send({});
  });
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

module.exports.app = app;
