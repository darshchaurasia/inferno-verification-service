// app.js
const express = require('express');
const DiscordOauth2 = require('discord-oauth2');
const config = require('./config');

const app = express();
const oauth = new DiscordOauth2();

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Discord OAuth2 Verification Bot</h1><p><a href="/login">Login with Discord</a></p>');
});

// Step 1: Redirect users to the Discord OAuth2 login
app.get('/login', (req, res) => {
  const authorizationUrl = oauth.generateAuthUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: ['identify'],
    responseType: 'code',
  });
  res.redirect(authorizationUrl);
});

// Step 2: Handle the OAuth2 callback from Discord
app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');

  // Log for debugging
  console.log("Client ID:", config.clientId);
  console.log("Client Secret:", config.clientSecret);
  console.log("Code received from Discord:", code);
  console.log("Redirect URI:", config.redirectUri);

  try {
    // Exchange the code for an access token
    const tokenData = await oauth.tokenRequest({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      scope: 'identify',
      redirectUri: config.redirectUri,
      grantType: 'authorization_code',
    });

    // Use the access token to get the user’s Discord profile info
    const userData = await oauth.getUser(tokenData.access_token);

    // Respond with the user's Discord info for now
    res.send(`
      <h1>Welcome, ${userData.username}#${userData.discriminator}!</h1>
      <p>ID: ${userData.id}</p>
      <p>Avatar: <img src="https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png" alt="Avatar"></p>
    `);
  } catch (error) {
    console.error('Error during OAuth2 callback:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Start the server on the dynamic port
const PORT = process.env.PORT || 3000;  // Use Railway's assigned port or 3000 for local development
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
