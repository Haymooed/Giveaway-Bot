const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSchedule, saveSchedule, deleteSchedule, getAllSchedules, getGuild } = require('../configManager');
const { parseTime, buildResponseEmbed } = require('../giveawayEmbed');

function canManage(interaction) {
  const settings = getGuild(interaction.guildId);
  if (interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return settings.managerRoles.some(id => interaction.member.roles.cache.has(id));
}

function canCreate(interaction) {
  const settings = getGuild(interaction.guildId);
  if (canManage(interaction)) return true;
  return settings.creatorRoles.some(id => interaction.member.roles.cache.has(id));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Manage scheduled giveaways')

    // ── create ─────────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Schedule a giveaway to start at a future time')
        .addStringOption(o =>
          o.setName('starts_in').setDescription('When to start — e.g. 2h, 1d').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('duration').setDescription('How long it runs — e.g. 24h, 7d').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20)
        )
        .addStringOption(o =>
          o.setName('prize').setDescription('What is being given away?').setRequired(true)
        )
    )

    // ── edit ───────────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription('Edit a scheduled giveaway')
        .addStringOption(o =>
          o.setName('id').setDescription('Schedule ID (from /list schedules)').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('prize').setDescription('New prize').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('duration').setDescription('New duration — e.g. 24h').setRequired(false)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('New winner count').setRequired(false).setMinValue(1).setMaxValue(20)
        )
    )

    // ── delete ─────────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a scheduled giveaway')
        .addStringOption(o =>
          o.setName('id').setDescription('Schedule ID (from /list schedules)').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── create ──────────────────────────────────────────────────────────────
    if (sub === 'create') {
      if (!canCreate(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', "You don't have permission to schedule giveaways.", 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const startsInStr  = interaction.options.getString('starts_in');
      const durationStr  = interaction.options.getString('duration');
      const winnerCount  = interaction.options.getInteger('winners');
      const prize        = interaction.options.getString('prize');

      const startsInMs = parseTime(startsInStr);
      const durationMs = parseTime(durationStr);

      if (!startsInMs) {
        const embed = buildResponseEmbed('❌ Invalid Starts In', 'Invalid starts_in format. E.g. `2h`, `1d`.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (!durationMs) {
        const embed = buildResponseEmbed('❌ Invalid Duration', 'Invalid duration format. E.g. `24h`, `7d`.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const id       = `${interaction.guildId}_${Date.now()}`;
      const startsAt = Date.now() + startsInMs;

      saveSchedule(id, {
        guildId:     interaction.guildId,
        channelId:   interaction.channelId,
        hostId:      interaction.user.id,
        prize,
        winnerCount,
        durationMs,
        startsAt,
        emoji:       getGuild(interaction.guildId).giveawayEmoji ?? '🎁',
      });

      const startsAtUnix = Math.floor(startsAt / 1000);
      const embed = buildResponseEmbed(
        '✅ Giveaway Scheduled',
        `Giveaway for **${prize}** scheduled to start <t:${startsAtUnix}:R>.\n\n\`ID: ${id}\``,
        'success'
      );
      return interaction.reply({
        embeds:    [embed],
        ephemeral: true,
      });
    }

    // ── edit ────────────────────────────────────────────────────────────────
    if (sub === 'edit') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const id       = interaction.options.getString('id');
      const schedule = getSchedule(id);

      if (!schedule || schedule.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Not Found', 'Schedule not found in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const newPrize    = interaction.options.getString('prize');
      const newDuration = interaction.options.getString('duration');
      const newWinners  = interaction.options.getInteger('winners');

      if (newPrize)    schedule.prize       = newPrize;
      if (newWinners)  schedule.winnerCount = newWinners;
      if (newDuration) {
        const ms = parseTime(newDuration);
        if (!ms) {
          const embed = buildResponseEmbed('❌ Invalid Duration', 'Invalid duration format.', 'error');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        schedule.durationMs = ms;
      }

      saveSchedule(id, schedule);
      const embed = buildResponseEmbed('✅ Schedule Updated', 'The scheduled giveaway has been updated successfully.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── delete ──────────────────────────────────────────────────────────────
    if (sub === 'delete') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const id       = interaction.options.getString('id');
      const schedule = getSchedule(id);

      if (!schedule || schedule.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Not Found', 'Schedule not found in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      deleteSchedule(id);
      const embed = buildResponseEmbed('✅ Schedule Deleted', `Schedule for **${schedule.prize}** has been deleted.`, 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx