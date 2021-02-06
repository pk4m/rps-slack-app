const userRegex = /<@([A-Z0-9]+)\|(.+)>/;
// For input of "<@U1234|user>" this function will return U1234
const extractUserIdFromEscapedFormat = (user) => {
  const matches = user.match(userRegex);
  return matches && matches[1];
}

module.exports = {
  extractUserIdFromEscapedFormat
};
