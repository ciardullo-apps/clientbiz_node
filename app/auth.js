var express = require('express');
var authRouter = express.Router();
const jwt = require('jsonwebtoken');
const config = require('./config');

// TODO:
const appUsers = {
  [config.userEmail]: {
    email: [config.userEmail],
    name: 'John Ciardullo',
    id: [config.userId]
  }
}

const validatePayloadMiddleware = (req, res, next) => {
  if(req.body) {
    next();
  } else {
    res.status(403).send({
      errorMessage: 'No payload'
    })
  }
};

const jwtMiddleware = (req, res, next) => {
  const authString = req.headers['authorization'];
	if(typeof authString === 'string' && authString.indexOf(' ') > -1) {
		const authArray = authString.split(' ');
		const token = authArray[1];
		jwt.verify(token, `${config.jwtKey}`, (err, decoded) => {
			if(err) {
				res.status(403).send({
		      errorMessage: 'Permission denied'
		    });
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		res.status(403).send({
			errorMessage: 'Permission denied'
		});

	}
};

function isAuthorizedUser(email) {
  if(email && appUsers.hasOwnProperty(email)) {
    return true;
  }
  console.log('Did not find appUsers', appUsers);
  return false;
};

authRouter.post('/authorize', validatePayloadMiddleware, (req, res) => {
  console.log('In /authorize', req.body);
  const userLogin = req.body;
  if(userLogin && userLogin.email && isAuthorizedUser(userLogin.email)) {
    const token = jwt.sign(userLogin, `${config.jwtKey}`);
    res.status(200).send({
      user: userLogin,
      token: token
    });
  } else {
    res.status(403).send({
      errorMessage: 'Permission denied'
    });
  }
});

authRouter.get('/me', jwtMiddleware, (req, res) => {
  console.log('In /me');
  res.status(200).send(req.decoded);
});

module.exports = authRouter;
