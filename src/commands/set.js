const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

const LANGUAGES = [
  { name: 'English',    value: 'en' },
  { name: 'Spanish',    value: 'es' },
  { name: 'French',     value: 'fr' },
  { name: 'German',     value: 'de' },
  { name: 'Portuguese', value: 'pt' },
  { name: 'Turkish',    value: 'tr' },
  { name: 'Arabic',     value: 'ar' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Configure bot settings for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sub =>
      sub
        .setName('emoji')
        .setDescription('Set the emoji shown on the giveaway entry button')
        .addStringOption(o =>
          o.setName('emoji').setDescription('A Discord emoji (e.g. 🎉 or a custom emoji)').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('language')
        .setDescription('Set the language the bot uses in this server')
        .addStringOption(o => {
          o.setName('language').setDescription('Language').setRequired(true);
          for (const lang of LANGUAGES) o.addChoices(lang);
          return o;
        })
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'emoji') {
      const emoji = interaction.options.getString('emoji').trim();
      setGuild(interaction.guildId, { giveawayEmoji: emoji });
      const embed = buildResponseEmbed('✅ Emoji Updated', `Giveaway button emoji set to ${emoji}`, 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'language') {
      const lang = interaction.options.getString('language');
      setGuild(interaction.guildId, { language: lang });
      const label = LANGUAGES.find(l => l.value === lang)?.name ?? lang;
      const embed = buildResponseEmbed('✅ Language Updated', `Language set to **${label}**.`, 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Built by Haymooed & Onyx