const JwtStrategy = require('passport-jwt').Strategy;
const JwtExtract = require('passport-jwt').ExtractJwt;
const config = require('./config');

module.exports = (passport) => {
  passport.serializeUser( (user, callback) => {
      callback(null, user);
  });

  passport.deserializeUser( (user, callback) => {
      callback(null, user);
  });

  passport.use(new JwtStrategy({
    jwtFromRequest: JwtExtract.fromAuthHeaderAsBearerToken(),
    secretOrKey: `${config.jwtKey}`,
  }, function (jwtPayload, callback) {
    console.log(jwtPayload);
    return callback(null, jwtPayload);
  }));
}
