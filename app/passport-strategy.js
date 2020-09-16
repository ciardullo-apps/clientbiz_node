const JwtStrategy = require('passport-jwt').Strategy;
const JwtExtract = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const config = require('./config');

module.exports = (passport) => {
  passport.serializeUser( (user, callback) => {
      callback(null, user);
  });

  passport.deserializeUser( (user, callback) => {
      callback(null, user);
  });

  // Use 'local' passport strategy for NodeJS/AngularJS
  // Use 'jwt' for Angular2

  // Configure the appropriate strategy in dotenv, depending on the environment
  // local testing uses Passport local strategy, requiring username and password
  // as request parameters in the AngularJS controllers for each request to a protected resource
  // other environments like Angular2 uses the JWT strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: JwtExtract.fromAuthHeaderAsBearerToken(),
    secretOrKey: `${config.jwtKey}`,
  }, function (jwtPayload, callback) {
    console.log(jwtPayload);
    return callback(null, jwtPayload);
  }));

  passport.use(new LocalStrategy(
    // LocalStrategy requires username and password attributes in the request
    // Local testing uses AngularJS controllers in public/js/core.js
    function(username, password, done) {
      return done(null, username); // Pass-through without failure
    }
  ));
}
