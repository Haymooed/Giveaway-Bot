const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('View the link of the support server'),

  async execute(interaction) {
    const link = process.env.SUPPORT_SERVER ?? 'https://discord.gg/yourserver';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('💬 Support Server')
      .setDescription(`Need help? Join the support server:\n[Click here to join](${link})`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

// Built by Haymooed & Onyx