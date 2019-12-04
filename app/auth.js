var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('./config');

// TODO: Register users in database
const appUsers = {
  [config.userEmail]: {
    email: [config.userEmail],
    name: 'John Ciardullo',
    id: [config.userId]
  }
}

function isAuthorizedUser(email) {
  if(email && appUsers.hasOwnProperty(email)) {
    return true;
  }
  console.log('Did not find user', email, appUsers);
  return false;
};

module.exports = (passport) => {

  const validatePayloadMiddleware = (req, res, next) => {
    if(req.body) {
      next();
    } else {
      res.status(403).send({
        errorMessage: 'No payload'
      })
    }
  };

  router.post('/authorize', validatePayloadMiddleware, (req, res) => {
    // console.log('In /authorize', req.body);
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

  router.get('/me', passport.authenticate('jwt', {session:true}), (req, res) => {
    // console.log('In /me', req.headers);
    res.status(200).send(req.user);
  });

  return router;
}
