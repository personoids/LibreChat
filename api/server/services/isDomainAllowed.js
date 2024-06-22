const getCustomConfig = require('~/server/services/Config/getCustomConfig');

async function isDomainAllowed(email) {
  if (!email) {
    return false;
  }

  const domain = email.split('@')[1];

  if (!domain) {
    return false;
  }

  return domain === "personoids.com";
}

module.exports = isDomainAllowed;
