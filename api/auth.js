const passport = require('./strategies/cognitoStrategy');

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = {
  passport,
  isAuthenticated,
};
