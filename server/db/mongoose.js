const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // set mongoose to use js built in promises

const dbUser = 'admin';
const dbPass = '339955';
const remoteMongoUri = `mongodb://${dbUser}:${dbPass}@ds125146.mlab.com:25146/todoapp`;

mongoose.connect(remoteMongoUri, {useMongoClient: true}).then(() => {
  console.log('Sucessfully connected to remote database');
}).catch((err) => {
  console.log('Remote database failed, switch to local instead.');
  mongoose.connect('mongodb://localhost:27017/TodoApp', {useMongoClient: true}).then(() => {
    console.log('Sucessfully connected to local database');
  }).catch((err) => {
    console.log('Error connecting to local database, exiting app');
  });
});

module.exports.mongoose = mongoose;
