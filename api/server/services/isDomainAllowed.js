const getCustomConfig = require('~/server/services/Config/getCustomConfig');

async function isDomainAllowed(email) {
  if (!email) {
    return false;
  }

  const domain = email.split('@')[1];

  if (!domain) {
    return false;
  }

  const customConfig = await getCustomConfig();
  if (!customConfig) {
    return domain === 'personoids.com';
  } else if (!customConfig?.registration?.allowedDomains) {
    return domain === 'personoids.com';
  }

  return customConfig.registration.allowedDomains.includes(domain);
}

module.exports = isDomainAllowed;
