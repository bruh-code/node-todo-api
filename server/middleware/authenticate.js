const {User} = require('../models/user');

/**
 * Middleware for authenticating the user in route /users/me
 * @param  {[type]}   req  The request
 * @param  {[type]}   res  The response
 * @param  {Function} next Next method
 * @return {[type]}        Add user and token to the request object. If no user is found by token passed reject with a Promise
 */
var authenticate = (req, res, next) => {
	var token = req.header('x-auth');
	User.findByToken(token).then((user) => {
		if(!user) {
			return Promise.reject(); // this makes it send 401 below
		}

		req.user = user;
		req.token = token;
		next();
	}).catch((e) => {
		res.status(401).send();
	});
};

module.exports = {authenticate};
