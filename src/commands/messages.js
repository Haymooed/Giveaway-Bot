const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('messages')
    .setDescription('View the number of messages a user has sent in this server')
    .addUserOption(o =>
      o.setName('user').setDescription('The user to check (defaults to you)').setRequired(false)
    ),

  async execute(interaction) {
    const settings = getGuild(interaction.guildId);
    if (!settings.messageCounterEnabled) {
      const embed = buildResponseEmbed('❌ Counter Disabled', 'Message counter is disabled in this server.', 'error');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const target = interaction.options.getUser('user') ?? interaction.user;
    const count  = settings.messageCounts?.[target.id] ?? 0;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('💬 Message Count')
      .setDescription(`${target} has sent **${count.toLocaleString()}** messages in this server.`)
      .setThumbnail(target.displayAvatarURL());

    return interaction.reply({ embeds: [embed] });
  },
};

// Built by Haymooed & Onyx