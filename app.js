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

// Track if the role assignment buttons have already been sent
let roleButtonsSent = false;

// Event: Bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register the /sendverificationbutton and /assignroles commands
  const commands = [
    new SlashCommandBuilder()
      .setName('sendverificationbutton')
      .setDescription('Sends a verification button in the channel'),
    new SlashCommandBuilder()
      .setName('assignroles')
      .setDescription('Sends buttons to assign roles for Gamer and CS')
  ];

  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, '758655680667320402'), // Replace with your server ID
      { body: commands },
    );
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle the /sendverificationbutton command
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'verify') {
    try {
      // Acknowledge the interaction immediately to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      // Generate the OAuth2 authorization URL
      const authorizationUrl = oauth.generateAuthUrl({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scope: ['identify'],
        responseType: 'code',
        state: interaction.user.id, // Use Discord user ID as state
      });

      // Send the verification link as an edited reply
      await interaction.editReply({
        content: `Please click [here](${authorizationUrl}) to verify your account.`,
      });
    } catch (error) {
      console.error('Error handling button interaction:', error);
    }
  }
});


// Handle the /assignroles command, allowing it to be used once
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand() && interaction.commandName === 'assignroles') {
    if (roleButtonsSent) {
      await interaction.reply({ content: 'Role assignment buttons have already been sent.', ephemeral: true });
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('assign_gamer')
        .setLabel('Gamer')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('assign_cs')
        .setLabel('CS')
        .setStyle(ButtonStyle.Primary)
    );

    // Send the role assignment message publicly and set the flag to true
    await interaction.reply({
      content: 'Click a button below to assign yourself a role:',
      components: [row],
    });

    roleButtonsSent = true; // Mark that the buttons have been sent
  }
});

// Handle button interactions for role assignment
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const guild = await client.guilds.fetch('758655680667320402'); // Replace with your server ID
    const member = await guild.members.fetch(interaction.user.id);

    if (interaction.customId === 'assign_gamer') {
      const gamerRole = guild.roles.cache.find(role => role.name === 'Gamer');
      if (gamerRole) {
        await member.roles.add(gamerRole);
        await interaction.reply({ content: 'You have been assigned the Gamer role!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Gamer role not found in this server.', ephemeral: true });
      }
    } else if (interaction.customId === 'assign_cs') {
      const csRole = guild.roles.cache.find(role => role.name === 'CS');
      if (csRole) {
        await member.roles.add(csRole);
        await interaction.reply({ content: 'You have been assigned the CS role!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'CS role not found in this server.', ephemeral: true });
      }
    }
  }
});

// Existing OAuth2 callback and role assignment (unchanged)
app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

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

    const guild = await client.guilds.fetch('758655680667320402'); // Replace with your server ID
    const member = await guild.members.fetch(userId);

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
