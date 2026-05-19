const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s ping to the Discord API and gateway'),

  async execute(interaction, client) {
    const sent  = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const round = sent.createdTimestamp - interaction.createdTimestamp;
    const ws    = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 API Latency',     value: `**${round}ms**`, inline: true },
        { name: '💓 Gateway Latency', value: `**${ws}ms**`,    inline: true },
      );

    return interaction.editReply({ content: '', embeds: [embed] });
  },
};

// Built by Haymooed & Onyx