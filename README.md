# Giveaway Bot

A highly customizable Discord bot built with Discord.js v14 that manages scheduled and real-time giveaways with entry requirements, template defaults, and logging.

## Features

- **Custom Entry Requirements**: Validate role possession, minimum level, and rolling message thresholds (daily, weekly, monthly, and total) before allowing entries. Includes bypass roles.
- **Slick Embeds**: Beautifully styled status, success, and error embeds.
- **Branding Customization**: Define custom hex colors, images, thumbnails, and follow-up creation messages for individual giveaways.
- **Scheduled Giveaways**: Set up giveaways to automatically start at a future date and time.
- **Templates**: Save configuration settings to templates and copy them quickly when starting new giveaways.
- **Auto Update & Bootstrapping**: Built-in git synchronization in `start.js` to automatically fetch changes and manage dependencies.
- **Performance & Caching**: Memory caching of configuration data to ensure minimal disk operations.
- **Health Check Endpoints**: Built-in HTTP health check server for uptime monitoring.

---

## Installation

### Prerequisites
- Node.js v16.9.0 or higher
- Git

### Setup
1. Clone the repository or set up the directory:
   ```bash
   git clone https://github.com/Haymooed/Giveaway-Bot.git
   cd Giveaway-Bot
   ```
2. Create a `.env` file in the root directory:
   ```env
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   PORT=3000
   ```
3. Run the bot:
   ```bash
   node start.js
   ```

---

## Slash Commands

### `/giveaway create`
Create a giveaway immediately. Supports 20 configuration options:

| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `duration` | String | Yes | Duration of the giveaway (e.g. `30s`, `15m`, `2h`, `1d`). |
| `winners` | Integer | Yes | The number of winners to select. |
| `prize` | String | Yes | The prize being given away. |
| `use-template` | String | No | Copy configuration settings from a saved template. |
| `channel` | Channel | No | The text channel to host the giveaway in. |
| `host` | User | No | The custom host user displayed on the embed. |
| `giveaway-create-message` | String | No | Custom message to send on creation (supports `{prize}`, `{host}`, `{link}`). |
| `giveaway-winners-role` | Role | No | Role to assign automatically to the winners. |
| `giveaway-winners-dm-message` | String | No | Custom DM notification text to send to winners. |
| `image` | String | No | Custom image URL to show at the bottom of the embed. |
| `thumbnail` | String | No | Custom thumbnail URL shown at the top-right of the embed. |
| `required-role` | Role | No | The role required to participate. |
| `required-level` | Integer | No | The minimum level required to enter. |
| `required-daily-messages` | Integer | No | The number of messages required in the last 24 hours. |
| `required-weekly-messages` | Integer | No | The number of messages required in the last 7 days. |
| `required-monthly-messages` | Integer | No | The number of messages required in the last 30 days. |
| `required-total-messages` | Integer | No | The total messages required. |
| `requirement-bypass-role` | Role | No | Members with this role bypass all requirements. |
| `color` | String | No | Embed color for the active giveaway (e.g. `#5865F2`). |
| `end-color` | String | No | Embed color for the ended giveaway (e.g. `#EB459E`). |

### Other Commands
- `/giveaway edit`: Edit active giveaways (prize, winner count, add time).
- `/giveaway end`: End an active giveaway immediately.
- `/giveaway delete`: Delete a giveaway message and its database entry.
- `/giveaway reroll`: Draw new winners from an ended giveaway.
- `/giveaway fix`: Manually draw winners and resolve a stuck active giveaway.
- `/giveaway creator-roles`: Manage roles permitted to create giveaways.
- `/giveaway manager-roles`: Manage roles permitted to use all giveaway commands.
- `/schedule create`: Schedule a giveaway for a future date/time.
- `/template create`: Save default configuration options to a template.
"# Giveaway-Bot" 
"# Giveaway-Bot" 
