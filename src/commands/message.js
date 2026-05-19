const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('message')
    .setDescription('Message counter settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommandGroup(group =>
      group
        .setName('counter')
        .setDescription('Manage the message counter')
        .addSubcommand(sub =>
          sub.setName('enable').setDescription('Enable message counter in this server')
        )
        .addSubcommand(sub =>
          sub.setName('disable').setDescription('Disable message counter in this server')
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'enable') {
      setGuild(interaction.guildId, { messageCounterEnabled: true });
      const embed = buildResponseEmbed('✅ Counter Enabled', 'Message counter has been enabled.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'disable') {
      setGuild(interaction.guildId, { messageCounterEnabled: false });
      const embed = buildResponseEmbed('✅ Counter Disabled', 'Message counter has been disabled.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx