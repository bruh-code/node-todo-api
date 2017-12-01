var express = require('express');
var bodyParser = require('body-parser');

var {ObjectID} = require('mongodb');
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });
  todo.save().then((doc) => {
    res.send(doc);
  }, (err) => {
    res.status(400).send(err);
  });
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({todos});
  }, (err) => {
    res.status(400).send(err);
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

module.exports.app = app;
