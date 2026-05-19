const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllGiveaways, getAllSchedules, getGuildTemplates } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('View lists of giveaways, schedules, and templates')

    .addSubcommand(sub =>
      sub.setName('giveaways').setDescription('View all active giveaways in this server')
    )
    .addSubcommand(sub =>
      sub.setName('schedules').setDescription('View all scheduled giveaways in this server')
    )
    .addSubcommand(sub =>
      sub.setName('templates').setDescription('View all giveaway templates in this server')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── giveaways ─────────────────────────────────────────────────────────
    if (sub === 'giveaways') {
      const active = Object.entries(getAllGiveaways()).filter(
        ([, g]) => !g.ended && g.guildId === interaction.guildId
      );

      if (active.length === 0) {
        const embed = buildResponseEmbed('📭 No Giveaways', 'No active giveaways in this server.', 'info');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const lines = active.map(([id, g]) => {
        const endsAt = Math.floor(g.endsAt / 1000);
        return `**${g.prize}** — ${g.entries.length} entries — ends <t:${endsAt}:R>\n\`Message ID: ${id}\``;
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎁 Active Giveaways (${active.length})`)
        .setDescription(lines.join('\n\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── schedules ─────────────────────────────────────────────────────────
    if (sub === 'schedules') {
      const schedules = Object.entries(getAllSchedules()).filter(
        ([, s]) => s.guildId === interaction.guildId
      );

      if (schedules.length === 0) {
        const embed = buildResponseEmbed('📭 No Schedules', 'No scheduled giveaways in this server.', 'info');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const lines = schedules.map(([id, s]) => {
        const startsAt = Math.floor(s.startsAt / 1000);
        return `**${s.prize}** — ${s.winnerCount} winner(s) — starts <t:${startsAt}:R>\n\`ID: ${id}\``;
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📅 Scheduled Giveaways (${schedules.length})`)
        .setDescription(lines.join('\n\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── templates ─────────────────────────────────────────────────────────
    if (sub === 'templates') {
      const templates = getGuildTemplates(interaction.guildId);

      if (templates.length === 0) {
        const embed = buildResponseEmbed('📭 No Templates', 'No templates in this server.', 'info');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const lines = templates.map(([id, t]) =>
        `**${t.name}** — Prize: ${t.prize} | ${t.winnerCount} winner(s) | ${t.time}\n\`ID: ${id}\``
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📝 Giveaway Templates (${templates.length})`)
        .setDescription(lines.join('\n\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx