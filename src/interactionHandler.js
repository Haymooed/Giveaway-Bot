const configManager = require('./configManager');
const { buildActiveEmbed, buildActionRow, buildResponseEmbed } = require('./giveawayEmbed');

async function handleButtonInteraction(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('enter_giveaway_')) {
    const messageId = customId.slice('enter_giveaway_'.length);
    const giveaway  = configManager.getGiveaway(messageId);

    if (!giveaway || giveaway.ended) {
      const embed = buildResponseEmbed('❌ Giveaway Inactive', 'This giveaway is no longer active.', 'error');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (giveaway.hostId === interaction.user.id) {
      const embed = buildResponseEmbed('❌ Entry Denied', 'You cannot enter your own giveaway.', 'error');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const member = interaction.member;
    const bypassRole = giveaway.requirementBypassRole;
    const hasBypass = bypassRole && member.roles.cache.has(bypassRole);

    if (!hasBypass) {
      if (giveaway.requiredRole && !member.roles.cache.has(giveaway.requiredRole)) {
        const embed = buildResponseEmbed('❌ Entry Denied', `You do not have the required role: <@&${giveaway.requiredRole}>`, 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const userData = configManager.getUserData(interaction.guildId, interaction.user.id);
      if (giveaway.requiredLevel && userData.level < giveaway.requiredLevel) {
        const embed = buildResponseEmbed('❌ Entry Denied', `You need to be at least Level **${giveaway.requiredLevel}** (you are Level **${userData.level}**).`, 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const recentCounts = configManager.getRecentMessageCounts(interaction.guildId, interaction.user.id);

      if (giveaway.requiredDailyMessages && recentCounts.daily < giveaway.requiredDailyMessages) {
        const embed = buildResponseEmbed('❌ Entry Denied', `You need at least **${giveaway.requiredDailyMessages}** daily messages (you have sent **${recentCounts.daily}** in the last 24h).`, 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.requiredWeeklyMessages && recentCounts.weekly < giveaway.requiredWeeklyMessages) {
        const embed = buildResponseEmbed('❌ Entry Denied', `You need at least **${giveaway.requiredWeeklyMessages}** weekly messages (you have sent **${recentCounts.weekly}** in the last 7 days).`, 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (giveaway.requiredMonthlyMessages && recentCounts.monthly < giveaway.requiredMonthlyMessages) {
        const embed = buildResponseEmbed('❌ Entry Denied', `You need at least **${giveaway.requiredMonthlyMessages}** monthly messages (you have sent **${recentCounts.monthly}** in the last 30 days).`, 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const totalMessages = userData.messages ?? 0;
      if (giveaway.requiredTotalMessages && totalMessages < giveaway.requiredTotalMessages) {
        const embed = buildResponseEmbed('❌ Entry Denied', `You need at least **${giveaway.requiredTotalMessages}** total messages (you have sent **${totalMessages}**).`, 'error');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    const added = configManager.addEntry(messageId, interaction.user.id);

    if (!added) {
      const embed = buildResponseEmbed('⚠️ Entry Warning', 'You have already entered this giveaway!', 'warning');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const updated = configManager.getGiveaway(messageId);
    const emoji   = updated.emoji ?? '🎁';

    await interaction.message.edit({
      embeds:     [buildActiveEmbed(updated)],
      components: [buildActionRow(messageId, updated.entries.length, emoji)],
    });

    const embed = buildResponseEmbed('🟢 Entry Confirmed', 'You have successfully entered the giveaway!', 'success');
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (customId.startsWith('view_entries_')) {
    const messageId = customId.slice('view_entries_'.length);
    const giveaway  = configManager.getGiveaway(messageId);

    if (!giveaway) {
      const embed = buildResponseEmbed('❌ Error', 'Giveaway data not found.', 'error');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const { entries } = giveaway;

    if (entries.length === 0) {
      const embed = buildResponseEmbed('👥 Entries', 'No one has entered yet — be the first!', 'info');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const listSlice = entries.slice(0, 30).map((id, i) => `${i + 1}. <@${id}>`).join('\n');
    const overflow  = entries.length > 30 ? `\n*…and ${entries.length - 30} more*` : '';

    const embed = buildResponseEmbed(
      `👥 Current Entries (${entries.length})`,
      `${listSlice}${overflow}`,
      'info'
    );
    return interaction.reply({
      embeds:    [embed],
      ephemeral: true,
    });
  }
}

module.exports = { handleButtonInteraction };