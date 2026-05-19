const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboards')

    .addSubcommand(sub =>
      sub.setName('levels').setDescription('View the level leaderboard in this server')
    )
    .addSubcommand(sub =>
      sub.setName('messages').setDescription('View the message leaderboard in this server')
    ),

  async execute(interaction) {
    const sub      = interaction.options.getSubcommand();
    const settings = getGuild(interaction.guildId);

    // ── levels ────────────────────────────────────────────────────────────
    if (sub === 'levels') {
      if (!settings.levelingEnabled) {
        const embed = buildResponseEmbed('❌ Leveling Disabled', 'Leveling is disabled in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const levels = settings.levels ?? {};
      const sorted = Object.entries(levels)
        .sort(([, a], [, b]) => b.level !== a.level ? b.level - a.level : b.xp - a.xp)
        .slice(0, 10);

      if (sorted.length === 0) {
        const embed = buildResponseEmbed('📭 No Data', 'No level data yet. Start chatting!', 'info');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const medals = ['🥇', '🥈', '🥉'];
      const lines  = sorted.map(([id, data], i) =>
        `${medals[i] ?? `**${i + 1}.**`} <@${id}> — Level **${data.level}** · ${data.xp} XP`
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🏆 Level Leaderboard')
        .setDescription(lines.join('\n'));

      return interaction.reply({ embeds: [embed] });
    }

    // ── messages ──────────────────────────────────────────────────────────
    if (sub === 'messages') {
      if (!settings.messageCounterEnabled) {
        const embed = buildResponseEmbed('❌ Counter Disabled', 'Message counter is disabled in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const counts = settings.messageCounts ?? {};
      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (sorted.length === 0) {
        const embed = buildResponseEmbed('📭 No Data', 'No message data yet.', 'info');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const medals = ['🥇', '🥈', '🥉'];
      const lines  = sorted.map(([id, count], i) =>
        `${medals[i] ?? `**${i + 1}.**`} <@${id}> — **${count.toLocaleString()}** messages`
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('💬 Message Leaderboard')
        .setDescription(lines.join('\n'));

      return interaction.reply({ embeds: [embed] });
    }
  },
};

// Built by Haymooed & Onyx