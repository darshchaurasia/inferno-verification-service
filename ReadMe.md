# Inferno Verification Service

Inferno Verification Service is a Discord bot that enables user verification through an OAuth2 flow. Verified users receive a specific role (e.g., "Verified") on the server after completing the verification process.

## Features

- Provides a verification button to users for OAuth2 authentication.
- Automatically assigns a "Verified" role to users upon successful verification.
- Built with `discord.js` and integrates with the Discord OAuth2 API.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Commands](#commands)
- [Usage](#usage)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Requirements

- [Node.js](https://nodejs.org/) v16.6.0 or higher
- A Discord bot application with OAuth2 permissions
- Manage Roles permission for the bot in the Discord server

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/inferno-verification-service.git
   cd inferno-verification-service```

2. Install dependencies:
```npm install```

## Environment Variables

Create a .env file in the root directory and configure the following variables:

```CLIENT_ID=your_client_id            # Discord Application Client ID
CLIENT_SECRET=your_client_secret    # Discord Application Client Secret
REDIRECT_URI=https://yourappdomain.com/discord/callback # Redirect URI for OAuth2
DISCORD_TOKEN=your_bot_token        # Bot Token from Discord Developer Portal
PORT=3000                           # (Optional) Port for the server; Railway will assign it dynamically```

Explanation of Variables
- CLIENT_ID: The client ID for your Discord application.
- CLIENT_SECRET: The client secret for your Discord application.
- REDIRECT_URI: The URI that users are redirected to after authorizing with Discord. Ensure this matches your settings in the Discord Developer Portal.
- DISCORD_TOKEN: The bot token that allows your bot to connect to Discord.
- PORT: (Optional) Port for local development. On deployment, use the assigned dynamic port.

## Commands

```/sendverificationbutton```

This command sends a verification message with a button in the current channel. Users can click the button to begin the verification process.


## Usage

1. Start the Bot:
```npm start```
2. Use the Verification Button:
- In Discord, type ```/sendverificationbutton``` in a text channel where the bot has permissions.
- The bot will post a message with a Verify button.
- Clicking the button starts the OAuth2 authentication flow.
3. Complete Verification:
- After clicking the verification link, users will authorize with Discord and be redirected back to the callback URL.
- If successful, the bot assigns the "Verified" role to the user.

## Deployment

You can deploy the bot on Railway or any other Node.js hosting platform.

### Steps for Railway Deployment
1. Add Environment Variables:
- Set up environment variables in the Railway dashboard according to the .env configuration above.
2. Deploy the Project:
- Railway will automatically detect and deploy the project.
- Ensure that the bot has the required permissions on your Discord server.


## Troubleshooting

### "Unknown interaction" Error
If you see an "Unknown interaction" error, ensure that interactions are acknowledged promptly using deferReply.

### Missing Permissions
If you encounter a "Missing Permissions" error, make sure:

- The bot has Manage Roles permission.
- The bot's role is higher in the role hierarchy than the "Verified" role.

### Callback URL Mismatch
- Ensure that the REDIRECT_URI in .env matches the redirect URI specified in the Discord Developer Portal.