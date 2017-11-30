const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // set mongoose to use js built in promises
mongoose.connect('mongodb://localhost:27017/TodoApp', {useMongoClient: true});

module.exports.mongoose = mongoose;
