require('dotenv').config();

module.exports = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  token: process.env.DISCORD_TOKEN,       // Add the bot token
  port: process.env.PORT || 3000,
};
