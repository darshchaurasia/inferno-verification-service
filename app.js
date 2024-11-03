// app.js
const express = require('express');
const DiscordOauth2 = require('discord-oauth2');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require('discord.js');
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

// Command to send a verification button in a specific channel
client.on('messageCreate', async (message) => {
  if (message.content === '!sendVerificationButton' && message.member.permissions.has('ADMINISTRATOR')) {
    // Create a button for verification
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify')
        .setLabel('Verify')
        .setStyle(ButtonStyle.Primary)
    );

    // Send the message with the button
    await message.channel.send({
      content: 'Click the button below to verify and get the Verified role!',
      components: [row],
    });
  }
});

// Handle button interaction
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'verify') {
    const authorizationUrl = oauth.generateAuthUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scope: ['identify'],
      responseType: 'code',
      state: interaction.user.id, // We use the Discord user ID as the state
    });

    // Send a link to the user to complete verification
    await interaction.reply({
      content: `Please click [here](${authorizationUrl}) to verify your account.`,
      ephemeral: true, // Makes the message visible only to the user who clicked
    });
  }
});

// Step 2: Handle the OAuth2 callback from Discord
app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state; // User ID is stored in the state parameter
  
  if (!code || !userId) return res.send('No code or user ID provided.');

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

    // Fetch the guild (server) and assign the role
    const guild = await client.guilds.fetch('758655680667320402'); // Replace with your server ID
    const member = await guild.members.fetch(userId); // Fetch the member by user ID

    // Define the "Verified" role (make sure this role exists in your server)
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Log in to Discord
client.login('YOUR_BOT_TOKEN');
