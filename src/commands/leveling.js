const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leveling')
    .setDescription('Configure the leveling system for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sub =>
      sub.setName('enable').setDescription('Enable leveling — the bot will track XP and levels')
    )
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('Disable leveling — the bot will stop tracking XP')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'enable') {
      setGuild(interaction.guildId, { levelingEnabled: true });
      const embed = buildResponseEmbed('✅ Leveling Enabled', 'Members will now earn XP by chatting.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'disable') {
      setGuild(interaction.guildId, { levelingEnabled: false });
      const embed = buildResponseEmbed('✅ Leveling Disabled', 'XP data is preserved but no longer updated.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx