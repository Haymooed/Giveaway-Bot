const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getTemplate, saveTemplate, deleteTemplate, getGuildTemplates, getGuild } = require('../configManager');
const { buildResponseEmbed } = require('../giveawayEmbed');

function canManage(interaction) {
  const settings = getGuild(interaction.guildId);
  if (interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return settings.managerRoles.some(id => interaction.member.roles.cache.has(id));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Manage giveaway templates')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // ── create ─────────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a reusable giveaway template')
        .addStringOption(o =>
          o.setName('name').setDescription('Template name').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('prize').setDescription('Default prize').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('time').setDescription('Default duration — e.g. 24h').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('Default winner count').setRequired(true).setMinValue(1).setMaxValue(20)
        )
    )

    // ── edit ───────────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription('Edit a giveaway template')
        .addStringOption(o =>
          o.setName('id').setDescription('Template ID (from /list templates)').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('name').setDescription('New name').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('prize').setDescription('New prize').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('time').setDescription('New duration').setRequired(false)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('New winner count').setRequired(false).setMinValue(1).setMaxValue(20)
        )
    )

    // ── delete ─────────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a giveaway template')
        .addStringOption(o =>
          o.setName('id').setDescription('Template ID (from /list templates)').setRequired(true)
        )
    )

    // ── duplicate ──────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('duplicate')
        .setDescription('Duplicate a giveaway template')
        .addStringOption(o =>
          o.setName('id').setDescription('Template ID to duplicate').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('name').setDescription('Name for the new copy').setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (!canManage(interaction)) {
      const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── create ──────────────────────────────────────────────────────────────
    if (sub === 'create') {
      const name    = interaction.options.getString('name');
      const prize   = interaction.options.getString('prize');
      const time    = interaction.options.getString('time');
      const winners = interaction.options.getInteger('winners');

      const id = `tmpl_${interaction.guildId}_${Date.now()}`;
      saveTemplate(id, { guildId: interaction.guildId, name, prize, time, winnerCount: winners });

      const embed = buildResponseEmbed(
        '✅ Template Created',
        `Template **${name}** created.\n\n\`ID: ${id}\``,
        'success'
      );
      return interaction.reply({
        embeds:    [embed],
        ephemeral: true,
      });
    }

    // ── edit ────────────────────────────────────────────────────────────────
    if (sub === 'edit') {
      const id       = interaction.options.getString('id');
      const template = getTemplate(id);

      if (!template || template.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Not Found', 'Template not found in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const newName    = interaction.options.getString('name');
      const newPrize   = interaction.options.getString('prize');
      const newTime    = interaction.options.getString('time');
      const newWinners = interaction.options.getInteger('winners');

      if (newName)    template.name        = newName;
      if (newPrize)   template.prize       = newPrize;
      if (newTime)    template.time        = newTime;
      if (newWinners) template.winnerCount = newWinners;

      saveTemplate(id, template);
      const embed = buildResponseEmbed('✅ Template Updated', 'The template has been updated.', 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── delete ──────────────────────────────────────────────────────────────
    if (sub === 'delete') {
      const id       = interaction.options.getString('id');
      const template = getTemplate(id);

      if (!template || template.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Not Found', 'Template not found in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      deleteTemplate(id);
      const embed = buildResponseEmbed('✅ Template Deleted', `Template **${template.name}** has been deleted.`, 'success');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── duplicate ────────────────────────────────────────────────────────────
    if (sub === 'duplicate') {
      const id       = interaction.options.getString('id');
      const template = getTemplate(id);

      if (!template || template.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Not Found', 'Template not found in this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const newName = interaction.options.getString('name') ?? `${template.name} (copy)`;
      const newId   = `tmpl_${interaction.guildId}_${Date.now()}`;
      saveTemplate(newId, { ...template, name: newName });

      const embed = buildResponseEmbed(
        '✅ Template Duplicated',
        `Template duplicated as **${newName}**.\n\n\`ID: ${newId}\``,
        'success'
      );
      return interaction.reply({
        embeds:    [embed],
        ephemeral: true,
      });
    }
  },
};

// Built by Haymooed & Onyx