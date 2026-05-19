const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, getGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('View your or someone else\'s level, XP, and total messages')
    .addUserOption(o =>
      o.setName('user').setDescription('The user to check (defaults to you)').setRequired(false)
    ),

  async execute(interaction) {
    const settings = getGuild(interaction.guildId);
    if (!settings.levelingEnabled) {
      const embed = buildResponseEmbed('❌ Leveling Disabled', 'Leveling is disabled in this server.', 'error');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const target   = interaction.options.getUser('user') ?? interaction.user;
    const userData = getUserData(interaction.guildId, target.id);
    const xpNeeded = (userData.level + 1) * 100;
    const progress = Math.floor((userData.xp / xpNeeded) * 20);
    const bar      = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${target.username}'s Level`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🏅 Level',      value: `**${userData.level}**`,    inline: true },
        { name: '✨ XP',         value: `**${userData.xp} / ${xpNeeded}**`, inline: true },
        { name: '💬 Messages',   value: `**${userData.messages ?? 0}**`, inline: true },
        { name: '📈 Progress',   value: `\`${bar}\` ${userData.xp}/${xpNeeded}`, inline: false },
      );

    return interaction.reply({ embeds: [embed] });
  },
};

// Built by Haymooed & Onyx