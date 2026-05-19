const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COMMANDS = [
  { name: '/giveaway create',          desc: 'Create a giveaway' },
  { name: '/giveaway delete',          desc: 'Delete a giveaway' },
  { name: '/giveaway edit',            desc: 'Edit a giveaway' },
  { name: '/giveaway end',             desc: 'End a giveaway immediately' },
  { name: '/giveaway fix',             desc: 'Fix a giveaway that failed to end' },
  { name: '/giveaway reroll',          desc: 'Reroll the winner(s) of a giveaway' },
  { name: '/giveaway creator-roles',   desc: 'Set roles that can create giveaways' },
  { name: '/giveaway manager-roles',   desc: 'Set roles with full bot access' },
  { name: '/schedule create',          desc: 'Schedule a giveaway' },
  { name: '/schedule edit',            desc: 'Edit a scheduled giveaway' },
  { name: '/schedule delete',          desc: 'Delete a scheduled giveaway' },
  { name: '/template create',          desc: 'Create a giveaway template' },
  { name: '/template edit',            desc: 'Edit a giveaway template' },
  { name: '/template delete',          desc: 'Delete a giveaway template' },
  { name: '/template duplicate',       desc: 'Duplicate a giveaway template' },
  { name: '/list giveaways',           desc: 'View all active giveaways' },
  { name: '/list schedules',           desc: 'View all scheduled giveaways' },
  { name: '/list templates',           desc: 'View all giveaway templates' },
  { name: '/logger channel',           desc: 'Set the giveaway logger channel' },
  { name: '/logger enable',            desc: 'Enable the giveaway logger' },
  { name: '/logger disable',           desc: 'Disable the giveaway logger' },
  { name: '/set emoji',                desc: 'Set the giveaway button emoji' },
  { name: '/set language',             desc: 'Set the bot language for this server' },
  { name: '/leveling enable',          desc: 'Enable leveling in this server' },
  { name: '/leveling disable',         desc: 'Disable leveling in this server' },
  { name: '/level',                    desc: 'View your or someone\'s level and XP' },
  { name: '/leaderboard levels',       desc: 'View the level leaderboard' },
  { name: '/leaderboard messages',     desc: 'View the message leaderboard' },
  { name: '/message counter enable',   desc: 'Enable message counter' },
  { name: '/message counter disable',  desc: 'Disable message counter' },
  { name: '/messages',                 desc: 'View message count for a user' },
  { name: '/premium activate',         desc: 'Activate premium in this server' },
  { name: '/premium deactivate',       desc: 'Deactivate premium in this server' },
  { name: '/ping',                     desc: 'Check the bot\'s latency' },
  { name: '/stats',                    desc: 'View bot statistics' },
  { name: '/invite',                   desc: 'Get the bot invite link' },
  { name: '/support',                  desc: 'Get the support server link' },
  { name: '/translate',                desc: 'Help translate the bot' },
  { name: '/help',                     desc: 'View this command list' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View a list of all commands'),

  async execute(interaction) {
    const half  = Math.ceil(COMMANDS.length / 2);
    const left  = COMMANDS.slice(0, half);
    const right = COMMANDS.slice(half);

    const fmt = list => list.map(c => `\`${c.name}\`\n${c.desc}`).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📋  Command List')
      .setDescription('───────────────────────────────────────')
      .addFields(
        { name: '​', value: fmt(left),  inline: true },
        { name: '​', value: fmt(right), inline: true },
      )
      .setFooter({ text: `${COMMANDS.length} commands total  •  Built by Haymooed & Onyx` });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

// Built by Haymooed & Onyx