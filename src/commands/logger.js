const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuild, setGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logger')
    .setDescription('Configure the giveaway logger')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sub =>
      sub
        .setName('channel')
        .setDescription('Set the channel where giveaway events will be logged')
        .addChannelOption(o =>
          o.setName('channel').setDescription('The log channel').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('enable').setDescription('Enable the giveaway logger')
    )
    .addSubcommand(sub =>
      sub.setName('disable').setDescription('Disable the giveaway logger')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      setGuild(interaction.guildId, { loggerChannelId: channel.id });
      const embed = buildResponseEmbed('✅ Logger Configured', `Logger channel set to ${channel}.`, 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'enable') {
      const settings = getGuild(interaction.guildId);
      if (!settings.loggerChannelId) {
        const embed = buildResponseEmbed('❌ Channel Not Set', 'Set a logger channel first with `/logger channel`.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      setGuild(interaction.guildId, { loggerEnabled: true });
      const embed = buildResponseEmbed('✅ Logger Enabled', 'The giveaway logger has been enabled.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'disable') {
      setGuild(interaction.guildId, { loggerEnabled: false });
      const embed = buildResponseEmbed('✅ Logger Disabled', 'The giveaway logger has been disabled.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx