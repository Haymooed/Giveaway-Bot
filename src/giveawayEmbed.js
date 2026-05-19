const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const THUMBNAIL_URL = 'https://cdn3.emoji.gg/emojis/3973_gift.png';

function parseTime(timeStr) {
  const match = timeStr.trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit  = match[2].toLowerCase();
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}

function buildActiveEmbed(giveaway) {
  const endsAtUnix = Math.floor(giveaway.endsAt / 1000);
  const emoji      = giveaway.emoji ?? '🎁';

  let color = 0x5865f2;
  if (giveaway.color) {
    const cleaned = giveaway.color.replace('#', '').replace('0x', '');
    const parsedColor = parseInt(cleaned, 16);
    if (!isNaN(parsedColor)) color = parsedColor;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🏆  GIVEAWAY STARTED  🏆')
    .setDescription(
      'A new giveaway has begun! Click the button below to enter.\n\n' +
      '───────────────────────────────────────'
    )
    .addFields(
      { name: `${emoji}  Prize`,     value: `**${giveaway.prize}**`,          inline: true },
      { name: '🏅  Winners',         value: `**${giveaway.winnerCount}**`,    inline: true },
      { name: '​',              value: '​',                         inline: true },
      { name: '👤  Hosted by',       value: `<@${giveaway.hostId}>`,          inline: true },
      { name: '👥  Entries',         value: `**${giveaway.entries.length}**`, inline: true },
      { name: '​',              value: '​',                         inline: true },
      {
        name:   '⏱️  Time Left',
        value:  `<t:${endsAtUnix}:R>  *(Ends <t:${endsAtUnix}:f>)*`,
        inline: false,
      },
    )
    .setFooter({ text: '───────────────────────────────────────' });

  if (giveaway.thumbnail) {
    embed.setThumbnail(giveaway.thumbnail);
  } else {
    embed.setThumbnail(THUMBNAIL_URL);
  }

  if (giveaway.image) {
    embed.setImage(giveaway.image);
  } else if (giveaway.bannerUrl) {
    embed.setImage(giveaway.bannerUrl);
  }

  const reqLines = [];
  if (giveaway.requiredRole) reqLines.push(`• **Required Role:** <@&${giveaway.requiredRole}>`);
  if (giveaway.requiredLevel) reqLines.push(`• **Required Level:** Level ${giveaway.requiredLevel}+`);
  if (giveaway.requiredDailyMessages) reqLines.push(`• **Daily Messages (last 24h):** ${giveaway.requiredDailyMessages}`);
  if (giveaway.requiredWeeklyMessages) reqLines.push(`• **Weekly Messages (last 7d):** ${giveaway.requiredWeeklyMessages}`);
  if (giveaway.requiredMonthlyMessages) reqLines.push(`• **Monthly Messages (last 30d):** ${giveaway.requiredMonthlyMessages}`);
  if (giveaway.requiredTotalMessages) reqLines.push(`• **Total Messages:** ${giveaway.requiredTotalMessages}`);
  if (giveaway.requirementBypassRole) reqLines.push(`• **Bypass Role:** <@&${giveaway.requirementBypassRole}>`);

  if (reqLines.length > 0) {
    embed.addFields({ name: '🔒  Entry Requirements', value: reqLines.join('\n'), inline: false });
  }

  return embed;
}

function buildEndedEmbed(giveaway, winners) {
  const endsAtUnix     = Math.floor(giveaway.endsAt / 1000);
  const winnerMentions = winners.length > 0
    ? winners.map(id => `<@${id}>`).join(', ')
    : '*No valid entries*';

  let color = 0xeb459e;
  if (giveaway.endColor) {
    const cleaned = giveaway.endColor.replace('#', '').replace('0x', '');
    const parsedColor = parseInt(cleaned, 16);
    if (!isNaN(parsedColor)) color = parsedColor;
  } else if (giveaway.color) {
    const cleaned = giveaway.color.replace('#', '').replace('0x', '');
    const parsedColor = parseInt(cleaned, 16);
    if (!isNaN(parsedColor)) color = parsedColor;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎉  GIVEAWAY ENDED  🎉')
    .setDescription(
      'This giveaway has concluded. Thank you to everyone who entered!\n\n' +
      '───────────────────────────────────────'
    )
    .addFields(
      { name: '🎁  Prize',         value: `**${giveaway.prize}**`,          inline: true },
      { name: '🏅  Winners',       value: `**${giveaway.winnerCount}**`,    inline: true },
      { name: '​',            value: '​',                         inline: true },
      { name: '👤  Hosted by',     value: `<@${giveaway.hostId}>`,          inline: true },
      { name: '👥  Total Entries', value: `**${giveaway.entries.length}**`, inline: true },
      { name: '​',            value: '​',                         inline: true },
      { name: '🏆  Winner(s)',     value: winnerMentions,                   inline: false },
      { name: '⏱️  Ended',         value: `<t:${endsAtUnix}:f>`,           inline: false },
    )
    .setFooter({ text: '───────────────────────────────────────' });

  if (giveaway.thumbnail) {
    embed.setThumbnail(giveaway.thumbnail);
  } else {
    embed.setThumbnail(THUMBNAIL_URL);
  }

  if (giveaway.image) {
    embed.setImage(giveaway.image);
  } else if (giveaway.bannerUrl) {
    embed.setImage(giveaway.bannerUrl);
  }

  return embed;
}

function buildActionRow(messageId, entryCount, emoji = '🎁') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`enter_giveaway_${messageId}`)
      .setLabel(`${emoji} Enter Giveaway`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`view_entries_${messageId}`)
      .setLabel(`👥 View Entries (${entryCount})`)
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildResponseEmbed(title, description, type = 'info') {
  const colors = {
    success: 0x2ecc71,
    error: 0xe74c3c,
    warning: 0xf1c40f,
    info: 0x5865f2,
  };
  return new EmbedBuilder()
    .setColor(colors[type] ?? colors.info)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

module.exports = { parseTime, buildActiveEmbed, buildEndedEmbed, buildActionRow, buildResponseEmbed };