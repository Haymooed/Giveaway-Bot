<div align="center">

# Onyx

A feature-rich, high-performance giveaway and server activity bot built with Discord.js.
Designed for custom giveaways, server activity tracking, and community leveling.

</div>

---

## Overview

Onyx is a powerful, fully optimized Discord giveaway and utility bot engineered for performance and extensibility. It supports advanced entry requirements, level/XP metrics, templates, and scheduled giveaways, backed by a persistent data store with an efficient in-memory cache layer.

---

## Features

### Giveaways
Run customizable, button-based giveaways.

- Create giveaways with custom prizes, durations, and winner counts
- Add custom active and ended embed colors, banner images, and thumbnails
- Require specific roles, minimum server levels, or message count limits to enter
- Configure bypass roles, custom winner role assignment, and personalized winner DMs

### Activity & Message Tracking
Track active participation across your server.

- Tracks rolling message counts over dynamic daily, weekly, and monthly windows
- View server activity metrics via interactive commands
- Grant entry permissions based on rolling user message volume

### Leveling System
Reward your community's active chatters.

- Automatic XP allocation based on text messages
- Fully configurable level-up notifications sent to the channel
- Use earned levels to unlock access to exclusive giveaways

### Scheduling & Templates
Set up events in advance or reuse setups.

- Schedule giveaways to automatically start at a future date and time
- Save custom giveaway default settings as reusable templates to launch new ones in seconds

### Role Management & Logs
Manage permissions and log actions.

- **Manager Roles** — users permitted to run and manage all giveaways
- **Creator Roles** — users permitted to create giveaways and templates
- Set up dedicated logging channels to log bot activity

---

## Setup

**Requirements:** Node.js >= 16.9.0

To run Onyx, you must use our dedicated bootstrapper `start.js`.

> [!IMPORTANT]
> The `start.js` bootstrapper handles dependency installation, git repository synchronization, and secure launch. To obtain the `start.js` file, you must join our support server: **[discord.gg/Onyx](https://discord.gg/UnAHC7Vmum)**.

```bash
# 1. Place start.js in the root of the project directory
# (Obtain start.js from discord.gg/Onyx)

# 2. Configure the bot
# Create a .env file with your BOT_TOKEN and CLIENT_ID

# 3. Start the bot
node start.js
```

---

## Project Structure

```
Giveaway-Bot/
├── start.js                  Bootstrapper & launcher
├── package.json              Dependencies
├── config.json               JSON Database
├── src/
│   ├── index.js              Main entry point
│   ├── configManager.js      In-memory config cache & database wrapper
│   ├── giveawayEmbed.js      Utility functions for embeds
│   ├── interactionHandler.js Button interaction receiver
│   └── commands/             Slash commands
│       ├── giveaway.js
│       ├── help.js
│       ├── invite.js
│       ├── leaderboard.js
│       ├── level.js
│       ├── leveling.js
│       ├── list.js
│       ├── logger.js
│       ├── message.js
│       ├── messages.js
│       ├── ping.js
│       ├── premium.js
│       ├── schedule.js
│       ├── set.js
│       ├── stats.js
│       ├── support.js
│       ├── template.js
│       └── translate.js
```

---

## Credits

**Developer** — [Haymooed](https://github.com/Haymooed)  
**Organisation** — [Onyx Development](https://discord.gg/UnAHC7Vmum)  

---

## Support

Join the Onyx Discord server for help, updates, and community support.

**[discord.gg/Onyx](https://discord.gg/UnAHC7Vmum)**

---

<div align="center">

© 2026 Onyx. All rights reserved.

</div>
