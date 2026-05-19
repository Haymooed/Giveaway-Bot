const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('View the translation link for the bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🌍 Help Translate GiveawayBot')
      .setDescription(
        'Want to help translate the bot into your language?\n\n' +
        'Open a ticket in the support server and a team member will get you set up.\n\n' +
        `Support: ${process.env.SUPPORT_SERVER ?? 'https://discord.gg/yourserver'}`
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

// Built by Haymooed & Onyx