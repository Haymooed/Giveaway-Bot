require('dotenv').config();

const http = require('http');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { handleButtonInteraction }                                       = require('./interactionHandler');
const { buildActiveEmbed, buildActionRow, buildEndedEmbed, buildResponseEmbed } = require('./giveawayEmbed');
const {
  getAllGiveaways, saveGiveaway,
  getAllSchedules, deleteSchedule,
  getGuild, getUserData, setUserData, incrementMessages,
} = require('./configManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commands  = [];

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag} (${client.user.id})`);

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ Registered ${commands.length} slash command(s)`);
  } catch (err) {
    console.error('⚠️ Failed to register slash commands:', err.message);
  }

  startScheduler();
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      return command.execute(interaction, client);
    }

    if (interaction.isButton()) {
      return handleButtonInteraction(interaction);
    }
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction.isRepliable?.()) {
      const embed = buildResponseEmbed('❌ Error', 'There was an error handling this interaction.', 'error');
      const payload = { embeds: [embed], ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const settings = getGuild(message.guild.id);

  if (settings.messageCounterEnabled) {
    incrementMessages(message.guild.id, message.author.id);
  }

  if (settings.levelingEnabled) {
    const userData = getUserData(message.guild.id, message.author.id);
    const xpGain   = Math.floor(Math.random() * 11) + 15;
    userData.xp       = (userData.xp ?? 0) + xpGain;
    userData.messages = (userData.messages ?? 0) + 1;

    const xpNeeded = (userData.level + 1) * 100;
    if (userData.xp >= xpNeeded) {
      userData.level += 1;
      userData.xp    -= xpNeeded;
      const levelEmbed = buildResponseEmbed(
        '🎉 Level Up!',
        `${message.author} leveled up to **Level ${userData.level}**!`,
        'success'
      );
      await message.channel
        .send({ embeds: [levelEmbed] })
        .catch(() => {});
    }

    setUserData(message.guild.id, message.author.id, userData);
  }
});

async function endGiveaway(messageId, giveaway) {
  try {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(messageId).catch(() => null);

    const pool    = [...giveaway.entries];
    const winners = [];
    const count   = Math.min(giveaway.winnerCount, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(idx, 1)[0]);
    }

    const updated = { ...giveaway, ended: true, winners };
    saveGiveaway(messageId, updated);

    if (message) {
      await message.edit({ embeds: [buildEndedEmbed(updated, winners)], components: [] });
    }

    const announcement = winners.length > 0
      ? `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`
      : `😔 The **${giveaway.prize}** giveaway ended with no entries.`;

    await channel.send(announcement);

    const guild = channel.guild;
    if (giveaway.winnersRole && guild) {
      const role = guild.roles.cache.get(giveaway.winnersRole);
      if (role) {
        for (const winnerId of winners) {
          const member = await guild.members.fetch(winnerId).catch(() => null);
          if (member) await member.roles.add(role).catch(() => {});
        }
      }
    }

    if (giveaway.winnersDmMessage && winners.length > 0) {
      for (const winnerId of winners) {
        const user = await client.users.fetch(winnerId).catch(() => null);
        if (user) {
          const formattedMsg = giveaway.winnersDmMessage
            .replace(/{prize}/g, giveaway.prize)
            .replace(/{winner}/g, user.toString())
            .replace(/{host}/g, `<@${giveaway.hostId}>`);
          const embed = buildResponseEmbed('🎉 You Won!', formattedMsg, 'success');
          await user.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }

    const settings = getGuild(giveaway.guildId);
    if (settings.loggerEnabled && settings.loggerChannelId) {
      const logCh = await client.channels.fetch(settings.loggerChannelId).catch(() => null);
      if (logCh) {
        await logCh.send(
          `📋 Giveaway ended — **${giveaway.prize}** hosted by <@${giveaway.hostId}> | ` +
          `Winners: ${winners.map(id => `<@${id}>`).join(', ') || 'none'}`
        ).catch(() => {});
      }
    }

    console.log(`✅ Giveaway ${messageId} ended. Winners: ${winners.join(', ') || 'none'}`);
  } catch (err) {
    console.error(`⚠️ Error ending giveaway ${messageId}:`, err);
  }
}

async function fireSchedule(scheduleId, schedule) {
  try {
    const channel = await client.channels.fetch(schedule.channelId).catch(() => null);
    if (!channel) { deleteSchedule(scheduleId); return; }

    const giveawayData = {
      channelId:   schedule.channelId,
      guildId:     schedule.guildId,
      hostId:      schedule.hostId,
      prize:       schedule.prize,
      winnerCount: schedule.winnerCount,
      endsAt:      Date.now() + schedule.durationMs,
      bannerUrl:   schedule.bannerUrl ?? null,
      emoji:       schedule.emoji ?? '🎁',
      entries:     [],
      ended:       false,
    };

    const msg = await channel.send({
      embeds:     [buildActiveEmbed(giveawayData)],
      components: [buildActionRow('PLACEHOLDER', 0, giveawayData.emoji)],
    });

    giveawayData.messageId = msg.id;
    saveGiveaway(msg.id, giveawayData);
    await msg.edit({ components: [buildActionRow(msg.id, 0, giveawayData.emoji)] });

    deleteSchedule(scheduleId);
    console.log(`✅ Scheduled giveaway ${scheduleId} fired → message ${msg.id}`);
  } catch (err) {
    console.error(`⚠️ Error firing schedule ${scheduleId}:`, err);
  }
}

function startScheduler() {
  setInterval(async () => {
    const now = Date.now();

    for (const [id, giveaway] of Object.entries(getAllGiveaways())) {
      if (!giveaway.ended && giveaway.endsAt <= now) {
        await endGiveaway(id, giveaway);
      }
    }

    for (const [id, schedule] of Object.entries(getAllSchedules())) {
      if (!schedule.fired && schedule.startsAt <= now) {
        await fireSchedule(id, schedule);
      }
    }
  }, 15_000);

  console.log('✅ Scheduler running (15s interval).');
}

if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'your_token_here') {
  console.error('❌ BOT_TOKEN is missing or still set to the placeholder. Set BOT_TOKEN in .env.');
  process.exit(1);
}

process.on('unhandledRejection', err => console.error('❌ Unhandled rejection:', err));
process.on('uncaughtException',  err => console.error('❌ Uncaught exception:',  err));

if (process.env.PORT) {
  const port = parseInt(process.env.PORT, 10);
  const host = process.env.HOST || '0.0.0.0';

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    console.error(`❌ Invalid PORT value "${process.env.PORT}". Must be 1–65535.`);
  } else {
    http.createServer((req, res) => {
      const stats = {
        ok:             client.isReady(),
        user:           client.user?.tag ?? null,
        activeGiveaways: Object.values(getAllGiveaways()).filter(g => !g.ended).length,
        uptimeSeconds:  Math.floor(process.uptime()),
      };

      if (req.url === '/health' || req.url === '/health.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(stats));
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not Found');
    })
      .listen(port, host, () => console.log(`🌐 Health server on http://${host}:${port}`))
      .on('error', err => console.error('⚠️ Health server error:', err.message));
  }
}

console.log('🔑 Logging in to Discord...');
client.login(process.env.BOT_TOKEN).catch(err => {
  console.error('❌ Failed to log in:', err.message);
  process.exit(1);
});