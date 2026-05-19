const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuild, setGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

// Premium codes are stored as env vars: PREMIUM_CODES=code1,code2,...
function isValidCode(code) {
  const codes = (process.env.PREMIUM_CODES ?? '').split(',').map(c => c.trim()).filter(Boolean);
  return codes.includes(code);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Manage premium for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sub =>
      sub
        .setName('activate')
        .setDescription('Activate premium in this server')
        .addStringOption(o =>
          o.setName('code').setDescription('Your premium activation code').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('deactivate').setDescription('Deactivate premium in this server')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'activate') {
      const code = interaction.options.getString('code');

      if (!isValidCode(code)) {
        const embed = buildResponseEmbed('❌ Activation Failed', 'Invalid or already-used premium code.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      setGuild(interaction.guildId, { premium: true });
      const embed = buildResponseEmbed('⭐ Premium Activated', 'Premium activated for this server! Enjoy the perks.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'deactivate') {
      const settings = getGuild(interaction.guildId);
      if (!settings.premium) {
        const embed = buildResponseEmbed('❌ Deactivation Failed', 'This server does not have premium active.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      setGuild(interaction.guildId, { premium: false });
      const embed = buildResponseEmbed('✅ Premium Deactivated', 'Premium deactivated.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx