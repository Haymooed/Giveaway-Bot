const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const {
  getGiveaway, saveGiveaway, deleteGiveaway, getAllGiveaways,
  getGuild, setGuild, getGuildTemplates
} = require('../configManager');
const { parseTime, buildActiveEmbed, buildEndedEmbed, buildActionRow, buildResponseEmbed } = require('../giveawayEmbed');

function canManage(interaction) {
  const member   = interaction.member;
  const settings = getGuild(interaction.guildId);
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return settings.managerRoles.some(id => member.roles.cache.has(id));
}

function canCreate(interaction) {
  const member   = interaction.member;
  const settings = getGuild(interaction.guildId);
  if (canManage(interaction)) return true;
  return settings.creatorRoles.some(id => member.roles.cache.has(id));
}

function pickWinners(entries, count) {
  const pool    = [...entries];
  const winners = [];
  const n       = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function distributeWinnerRewards(client, giveaway, winners) {
  if (!winners || winners.length === 0) return;
  
  try {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel && channel.guild && giveaway.winnersRole) {
      const role = channel.guild.roles.cache.get(giveaway.winnersRole);
      if (role) {
        for (const winnerId of winners) {
          const member = await channel.guild.members.fetch(winnerId).catch(() => null);
          if (member) await member.roles.add(role).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('Error adding role to winners:', err);
  }

  if (giveaway.winnersDmMessage) {
    for (const winnerId of winners) {
      const user = await client.users.fetch(winnerId).catch(() => null);
      if (user) {
        const formattedMsg = giveaway.winnersDmMessage
          .replace(/{prize}/g, giveaway.prize)
          .replace(/{winner}/g, user.toString())
          .replace(/{host}/g, `<@${giveaway.hostId}>`);
        const embed = buildResponseEmbed('🎉 You Won!', formattedMsg, 'success');
        await user.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a giveaway')
        .addStringOption(o =>
          o.setName('duration').setDescription('The duration for this giveaway').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('The number of winners for this giveaway').setRequired(true).setMinValue(1).setMaxValue(20)
        )
        .addStringOption(o =>
          o.setName('prize').setDescription('The prize of this giveaway').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('use-template').setDescription('The name of the template to copy the settings from for this giveaway').setRequired(false)
        )
        .addChannelOption(o =>
          o.setName('channel').setDescription('The channel this giveaway will be created in').addChannelTypes(ChannelType.GuildText).setRequired(false)
        )
        .addUserOption(o =>
          o.setName('host').setDescription('The host of this giveaway').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('giveaway-create-message').setDescription('The message the bot should send after creating this giveaway').setRequired(false)
        )
        .addRoleOption(o =>
          o.setName('giveaway-winners-role').setDescription('The role the bot should give to the winners of this giveaway').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('giveaway-winners-dm-message').setDescription('The message the bot should DM to the winners of this giveaway').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('image').setDescription('Image this giveaway embed will have (appears at the bottom of the embed). Accepts image/gif').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('thumbnail').setDescription('Thumbnail this giveaway embed will have (appears at the top right of the embed). Accepts image/gif').setRequired(false)
        )
        .addRoleOption(o =>
          o.setName('required-role').setDescription('The role required for the giveaway. For multiple, leave this blank and add in the next menu instead!').setRequired(false)
        )
        .addIntegerOption(o =>
          o.setName('required-level').setDescription('The level required to participate in this giveaway').setRequired(false).setMinValue(0)
        )
        .addIntegerOption(o =>
          o.setName('required-daily-messages').setDescription('The amount of messages required to be sent today to participate in this giveaway').setRequired(false).setMinValue(0)
        )
        .addIntegerOption(o =>
          o.setName('required-weekly-messages').setDescription('The amount of messages required to be sent this week to participate in this giveaway').setRequired(false).setMinValue(0)
        )
        .addIntegerOption(o =>
          o.setName('required-monthly-messages').setDescription('The amount of messages required to be sent this month to participate in this giveaway').setRequired(false).setMinValue(0)
        )
        .addIntegerOption(o =>
          o.setName('required-total-messages').setDescription('The amount of messages required to be sent totally to participate in this giveaway').setRequired(false).setMinValue(0)
        )
        .addRoleOption(o =>
          o.setName('requirement-bypass-role').setDescription('The role that can bypass all the requirements').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('color').setDescription('The color the giveaway embed should have. Must be a proper Hex Color Code').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('end-color').setDescription('The color the giveaway embed should have after the giveaway ends. Must be a proper Hex Color Code').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a giveaway')
        .addStringOption(o =>
          o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription('Edit a giveaway')
        .addStringOption(o =>
          o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('prize').setDescription('New prize name').setRequired(false)
        )
        .addStringOption(o =>
          o.setName('add_time').setDescription('Extra time to add — e.g. 1h, 30m').setRequired(false)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('New winner count').setRequired(false).setMinValue(1).setMaxValue(20)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('End a giveaway immediately')
        .addStringOption(o =>
          o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('fix')
        .setDescription('Force-fix a giveaway that failed to end')
        .addStringOption(o =>
          o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reroll')
        .setDescription('Reroll the winner(s) of an ended giveaway')
        .addStringOption(o =>
          o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('winners').setDescription('How many winners to reroll (default: original count)').setRequired(false).setMinValue(1).setMaxValue(20)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('creator-roles')
        .setDescription('Set roles that can create or schedule giveaways')
        .addRoleOption(o =>
          o.setName('role').setDescription('Role to add or remove').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('action')
            .setDescription('Add or remove this role')
            .setRequired(true)
            .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('manager-roles')
        .setDescription('Set roles that can use every giveaway command')
        .addRoleOption(o =>
          o.setName('role').setDescription('Role to add or remove').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('action')
            .setDescription('Add or remove this role')
            .setRequired(true)
            .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })
        )
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      if (!canCreate(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', "You don't have permission to create giveaways.", 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const timeStr          = interaction.options.getString('duration');
      const winnerCount      = interaction.options.getInteger('winners');
      const prize            = interaction.options.getString('prize');
      const templateId       = interaction.options.getString('use-template');
      const channelOption    = interaction.options.getChannel('channel');
      const hostOption       = interaction.options.getUser('host');
      const createMsg        = interaction.options.getString('giveaway-create-message');
      const winnersRole      = interaction.options.getRole('giveaway-winners-role');
      const winnersDm        = interaction.options.getString('giveaway-winners-dm-message');
      const image            = interaction.options.getString('image');
      const thumbnail        = interaction.options.getString('thumbnail');
      const requiredRole     = interaction.options.getRole('required-role');
      const requiredLevel    = interaction.options.getInteger('required-level');
      const requiredDaily    = interaction.options.getInteger('required-daily-messages');
      const requiredWeekly   = interaction.options.getInteger('required-weekly-messages');
      const requiredMonthly  = interaction.options.getInteger('required-monthly-messages');
      const requiredTotal    = interaction.options.getInteger('required-total-messages');
      const bypassRole       = interaction.options.getRole('requirement-bypass-role');
      const colorOption      = interaction.options.getString('color');
      const endColorOption   = interaction.options.getString('end-color');

      const settings = getGuild(interaction.guildId);

      if (templateId) {
        const templates = getGuildTemplates(interaction.guildId);
        const template = templates.find(([id, t]) => t.name.toLowerCase() === templateId.toLowerCase() || id === templateId)?.[1];
        if (!template) {
          const embed = buildResponseEmbed('❌ Template Not Found', `No template found named or with ID "${templateId}".`, 'error');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }

      if (colorOption) {
        const cleaned = colorOption.replace('#', '').replace('0x', '');
        if (isNaN(parseInt(cleaned, 16)) || (cleaned.length !== 6 && cleaned.length !== 3)) {
          const embed = buildResponseEmbed('❌ Invalid Color', 'Color must be a valid hex color code (e.g. `#FF0000` or `FF0000`).', 'error');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
      if (endColorOption) {
        const cleaned = endColorOption.replace('#', '').replace('0x', '');
        if (isNaN(parseInt(cleaned, 16)) || (cleaned.length !== 6 && cleaned.length !== 3)) {
          const embed = buildResponseEmbed('❌ Invalid End Color', 'End color must be a valid hex color code (e.g. `#FF0000` or `FF0000`).', 'error');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }

      const durationMs = parseTime(timeStr);
      if (!durationMs) {
        const embed = buildResponseEmbed('❌ Invalid Duration', 'Invalid time format. Use `30s`, `10m`, `2h`, `1d`.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const targetChannel = channelOption ?? interaction.channel;
      const hostUser = hostOption ?? interaction.user;

      await interaction.deferReply({ ephemeral: true });

      const giveawayData = {
        channelId:               targetChannel.id,
        guildId:                 interaction.guildId,
        hostId:                  hostUser.id,
        prize,
        winnerCount,
        endsAt:                  Date.now() + durationMs,
        bannerUrl:               null,
        image:                   image ?? null,
        thumbnail:               thumbnail ?? null,
        emoji:                   settings.giveawayEmoji ?? '🎁',
        entries:                 [],
        ended:                   false,
        
        requiredRole:            requiredRole ? requiredRole.id : null,
        requiredLevel:           requiredLevel ?? null,
        requiredDailyMessages:   requiredDaily ?? null,
        requiredWeeklyMessages:  requiredWeekly ?? null,
        requiredMonthlyMessages: requiredMonthly ?? null,
        requiredTotalMessages:   requiredTotal ?? null,
        requirementBypassRole:   bypassRole ? bypassRole.id : null,
        
        color:                   colorOption ?? null,
        endColor:                endColorOption ?? null,
        
        winnersRole:             winnersRole ? winnersRole.id : null,
        winnersDmMessage:        winnersDm ?? null,
      };

      const msg = await targetChannel.send({
        embeds:     [buildActiveEmbed(giveawayData)],
        components: [buildActionRow('PLACEHOLDER', 0, giveawayData.emoji)],
      }).catch(err => {
        console.error('Failed to send giveaway message:', err);
        return null;
      });

      if (!msg) {
        const embed = buildResponseEmbed('❌ Delivery Failed', 'Could not send the giveaway message. Make sure the bot has permission to send messages and embeds in that channel.', 'error');
        return interaction.editReply({ embeds: [embed] });
      }

      giveawayData.messageId = msg.id;
      saveGiveaway(msg.id, giveawayData);
      await msg.edit({ components: [buildActionRow(msg.id, 0, giveawayData.emoji)] }).catch(() => {});

      if (createMsg) {
        const formattedMsg = createMsg
          .replace(/{prize}/g, prize)
          .replace(/{host}/g, hostUser.toString())
          .replace(/{link}/g, msg.url);
        await targetChannel.send({ content: formattedMsg }).catch(() => {});
      }

      if (settings.loggerEnabled && settings.loggerChannelId) {
        const logCh = await client.channels.fetch(settings.loggerChannelId).catch(() => null);
        if (logCh) {
          await logCh.send(`📋 Giveaway created — **${prize}** | ${targetChannel} | Ends <t:${Math.floor(giveawayData.endsAt / 1000)}:R>`).catch(() => {});
        }
      }

      const successEmbed = buildResponseEmbed(
        '✅ Giveaway Started',
        `The giveaway has been successfully created in ${targetChannel}!\n\n🔗 **[Link to Giveaway](${msg.url})**`,
        'success'
      );
      return interaction.editReply({ embeds: [successEmbed] });
    }

    if (sub === 'delete') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const messageId = interaction.options.getString('message_id');
      const giveaway  = getGiveaway(messageId);

      if (!giveaway) {
        const embed = buildResponseEmbed('❌ Not Found', 'No giveaway found with that message ID.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Access Denied', 'That giveaway does not belong to this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }

      deleteGiveaway(messageId);
      const successEmbed = buildResponseEmbed('✅ Giveaway Deleted', `Giveaway **${giveaway.prize}** has been deleted.`, 'success');
      return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }

    if (sub === 'edit') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const messageId   = interaction.options.getString('message_id');
      const newPrize    = interaction.options.getString('prize');
      const addTimeStr  = interaction.options.getString('add_time');
      const newWinners  = interaction.options.getInteger('winners');
      const giveaway    = getGiveaway(messageId);

      if (!giveaway) {
        const embed = buildResponseEmbed('❌ Not Found', 'No giveaway found with that message ID.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Access Denied', 'That giveaway does not belong to this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.ended) {
        const embed = buildResponseEmbed('❌ Ended Already', 'That giveaway has already ended.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (newPrize)   giveaway.prize       = newPrize;
      if (newWinners) giveaway.winnerCount = newWinners;
      if (addTimeStr) {
        const extraMs = parseTime(addTimeStr);
        if (!extraMs) {
          const embed = buildResponseEmbed('❌ Invalid Duration', 'Invalid add_time format.', 'error');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        giveaway.endsAt += extraMs;
      }

      saveGiveaway(messageId, giveaway);

      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(messageId).catch(() => null);
        if (msg) {
          await msg.edit({
            embeds:     [buildActiveEmbed(giveaway)],
            components: [buildActionRow(messageId, giveaway.entries.length, giveaway.emoji)],
          });
        }
      }

      const successEmbed = buildResponseEmbed('✅ Giveaway Updated', 'Giveaway has been successfully updated.', 'success');
      return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }

    if (sub === 'end') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const messageId = interaction.options.getString('message_id');
      const giveaway  = getGiveaway(messageId);

      if (!giveaway) {
        const embed = buildResponseEmbed('❌ Not Found', 'No giveaway found with that message ID.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Access Denied', 'That giveaway does not belong to this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.ended) {
        const embed = buildResponseEmbed('❌ Ended Already', 'That giveaway has already ended.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      giveaway.endsAt = Date.now() - 1;
      saveGiveaway(messageId, giveaway);

      const successEmbed = buildResponseEmbed('✅ Ending Giveaway', 'The giveaway will end within the next 15 seconds.', 'success');
      return interaction.editReply({ embeds: [successEmbed] });
    }

    if (sub === 'fix') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const messageId = interaction.options.getString('message_id');
      const giveaway  = getGiveaway(messageId);

      if (!giveaway) {
        const embed = buildResponseEmbed('❌ Not Found', 'No giveaway found with that message ID.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Access Denied', 'That giveaway does not belong to this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const winners = pickWinners(giveaway.entries, giveaway.winnerCount);
      const updated = { ...giveaway, ended: true, winners };
      saveGiveaway(messageId, updated);

      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(messageId).catch(() => null);
        if (msg) await msg.edit({ embeds: [buildEndedEmbed(updated, winners)], components: [] }).catch(() => {});

        const announcement = winners.length > 0
          ? `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`
          : `😔 The **${giveaway.prize}** giveaway ended with no entries.`;
        await channel.send(announcement).catch(() => {});
        
        await distributeWinnerRewards(client, updated, winners);
      }

      const successEmbed = buildResponseEmbed('✅ Giveaway Fixed', 'Giveaway fixed and ended successfully.', 'success');
      return interaction.editReply({ embeds: [successEmbed] });
    }

    if (sub === 'reroll') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const messageId   = interaction.options.getString('message_id');
      const winnerCount = interaction.options.getInteger('winners');
      const giveaway    = getGiveaway(messageId);

      if (!giveaway) {
        const embed = buildResponseEmbed('❌ Not Found', 'No giveaway found with that message ID.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.guildId !== interaction.guildId) {
        const embed = buildResponseEmbed('❌ Access Denied', 'That giveaway does not belong to this server.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (!giveaway.ended) {
        const embed = buildResponseEmbed('❌ Not Ended', 'That giveaway has not ended yet.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.entries.length === 0) {
        const embed = buildResponseEmbed('❌ No Entries', 'There are no entries to reroll from.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const count   = winnerCount ?? giveaway.winnerCount;
      const winners = pickWinners(giveaway.entries, count);
      const updated = { ...giveaway, winners };
      saveGiveaway(messageId, updated);

      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (channel) {
        await channel.send(
          `🎲 **Reroll!** New winner(s) for **${giveaway.prize}**: ${winners.map(id => `<@${id}>`).join(', ')}`
        );
        
        await distributeWinnerRewards(client, updated, winners);
      }

      const successEmbed = buildResponseEmbed(
        '🎲 Giveaway Rerolled',
        `New winners have been selected:\n\n${winners.map(id => `<@${id}>`).join(', ')}`,
        'success'
      );
      return interaction.editReply({ embeds: [successEmbed] });
    }

    if (sub === 'creator-roles') {
      if (!canManage(interaction)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'You need Manage Server or a manager role.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const role     = interaction.options.getRole('role');
      const action   = interaction.options.getString('action');
      const settings = getGuild(interaction.guildId);
      let roles      = [...settings.creatorRoles];

      if (action === 'add') {
        if (!roles.includes(role.id)) roles.push(role.id);
      } else {
        roles = roles.filter(id => id !== role.id);
      }

      setGuild(interaction.guildId, { creatorRoles: roles });
      const successEmbed = buildResponseEmbed(
        '✅ Roles Configured',
        `Successfully ${action === 'add' ? 'added' : 'removed'} ${role} as a creator role.`,
        'success'
      );
      return interaction.reply({
        embeds:    [successEmbed],
        ephemeral: true,
      });
    }

    if (sub === 'manager-roles') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const embed = buildResponseEmbed('❌ Permission Denied', 'Only members with Manage Server can modify manager roles.', 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const role     = interaction.options.getRole('role');
      const action   = interaction.options.getString('action');
      const settings = getGuild(interaction.guildId);
      let roles      = [...settings.managerRoles];

      if (action === 'add') {
        if (!roles.includes(role.id)) roles.push(role.id);
      } else {
        roles = roles.filter(id => id !== role.id);
      }

      setGuild(interaction.guildId, { managerRoles: roles });
      const successEmbed = buildResponseEmbed(
        '✅ Roles Configured',
        `Successfully ${action === 'add' ? 'added' : 'removed'} ${role} as a manager role.`,
        'success'
      );
      return interaction.reply({
        embeds:    [successEmbed],
        ephemeral: true,
      });
    }
  },
  distributeWinnerRewards,
};