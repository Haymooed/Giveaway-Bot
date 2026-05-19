const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('View the invite link of the bot'),

  async execute(interaction, client) {
    const link = process.env.INVITE_LINK
      ?? `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=277025467456&scope=bot%20applications.commands`;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔗 Invite GiveawayBot')
      .setDescription(`[Click here to invite the bot to your server](${link})`)
      .setThumbnail(client.user.displayAvatarURL());

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

// Built by Haymooed & Onyx