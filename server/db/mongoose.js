const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // set mongoose to use js built in promises

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';

mongoose.connect(mongoUri, {useMongoClient: true}).then(() => {
  console.log('Sucessfully connected to database');
}).catch((err) => {

});

module.exports.mongoose = mongoose;
