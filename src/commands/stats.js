const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllGiveaways } = require('../configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View the bot\'s statistics'),

  async execute(interaction, client) {
    const giveaways = Object.values(getAllGiveaways());
    const active    = giveaways.filter(g => !g.ended).length;
    const ended     = giveaways.filter(g => g.ended).length;
    const totalEntr = giveaways.reduce((sum, g) => sum + g.entries.length, 0);

    const uptimeSec = Math.floor(process.uptime());
    const d = Math.floor(uptimeSec / 86400);
    const h = Math.floor((uptimeSec % 86400) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    const uptime = [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📊  Bot Stats')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '🤖 Bot',             value: `**${client.user.tag}**`,        inline: true },
        { name: '🌐 Servers',         value: `**${client.guilds.cache.size}**`, inline: true },
        { name: '⏱️ Uptime',           value: `**${uptime}**`,                 inline: true },
        { name: '🎁 Active Giveaways', value: `**${active}**`,                 inline: true },
        { name: '✅ Ended Giveaways',  value: `**${ended}**`,                  inline: true },
        { name: '👥 Total Entries',    value: `**${totalEntr}**`,              inline: true },
      )
      .setFooter({ text: 'Built by Haymooed & Onyx' });

    return interaction.reply({ embeds: [embed] });
  },
};

// Built by Haymooed & Onyx