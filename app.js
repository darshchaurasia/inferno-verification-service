// app.js
const express = require('express');
const DiscordOauth2 = require('discord-oauth2');
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');

const app = express();
const oauth = new DiscordOauth2();

// Discord Client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// Event: Bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Slash command to send a verification button
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() || interaction.commandName !== 'sendverificationbutton') return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('Verify')
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: 'Click the button below to verify and get the Verified role!',
    components: [row],
  });
});

// Handle button interaction for verification
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'verify') {
    const authorizationUrl = oauth.generateAuthUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scope: ['identify'],
      responseType: 'code',
      state: interaction.user.id, // Using user ID as state to identify user after OAuth2 flow
    });

    await interaction.reply({
      content: `Please click [here](${authorizationUrl}) to verify your account.`,
      ephemeral: true, // Message visible only to the user
    });
  }
});

// Step 2: Handle the OAuth2 callback from Discord
app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state; // Retrieve the Discord user ID from state

  if (!code || !userId) return res.send('No code or user ID provided.');

  try {
    // Exchange code for an access token
    const tokenData = await oauth.tokenRequest({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      scope: 'identify',
      redirectUri: config.redirectUri,
      grantType: 'authorization_code',
    });

    // Retrieve the user’s Discord profile info
    const userData = await oauth.getUser(tokenData.access_token);

    // Fetch the guild (server) and assign the Verified role
    const guild = await client.guilds.fetch('YOUR_GUILD_ID'); // Replace with your server ID
    const member = await guild.members.fetch(userId); // Fetch the member using user ID

    const verifiedRole = guild.roles.cache.find(role => role.name === 'Verified');
    if (verifiedRole) {
      await member.roles.add(verifiedRole);
      res.send(`<h1>Success!</h1><p>You have been verified and assigned the Verified role.</p>`);
    } else {
      res.send(`<h1>Error:</h1><p>The "Verified" role does not exist on this server.</p>`);
    }
  } catch (error) {
    console.error('Error during OAuth2 callback:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Start the server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Log in to Discord with the bot token from config
client.login(config.token);
