const express = require('express');
const DiscordOauth2 = require('discord-oauth2');
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes } = require('discord.js');
const config = require('./config');

const app = express();
const oauth = new DiscordOauth2();

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
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register the /sendverificationbutton command
  const commands = [
    new SlashCommandBuilder()
      .setName('sendverificationbutton')
      .setDescription('Sends a verification button in the channel'),
  ];

  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, '758655680667320402'), // Replace with your server ID
      { body: commands },
    );
    console.log('Slash command registered');
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
});

// Handle the /sendverificationbutton command
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
      state: interaction.user.id, // Use Discord user ID as state
    });

    await interaction.reply({
      content: `Please click [here](${authorizationUrl}) to verify your account.`,
      ephemeral: true, // Makes the message visible only to the user who clicked
    });
  }
});

// OAuth2 callback and role assignment (same as before)
app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state; // User ID is stored in the state parameter

  if (!code || !userId) return res.send('No code or user ID provided.');

  try {
    const tokenData = await oauth.tokenRequest({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      scope: 'identify',
      redirectUri: config.redirectUri,
      grantType: 'authorization_code',
    });

    const userData = await oauth.getUser(tokenData.access_token);

    const guild = await client.guilds.fetch('YOUR_GUILD_ID'); // Replace with your server ID
    const member = await guild.members.fetch(userId); // Fetch the member by user ID

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

// Log in to Discord
client.login(config.token);
