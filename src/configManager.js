const fs   = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

const DEFAULT_GUILD = {
  creatorRoles:          [],
  managerRoles:          [],
  loggerChannelId:       null,
  loggerEnabled:         false,
  levelingEnabled:       true,
  messageCounterEnabled: true,
  giveawayEmoji:         '🎁',
  language:              'en',
  premium:               false,
  levels:                {},
  messageCounts:         {},
};

const DEFAULT_CONFIG = {
  giveaways: {},
  schedules: {},
  templates: {},
  guilds:    {},
};

let cachedConfig = null;

function readRaw() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return null; }
}

function writeRaw(cfg) {
  try { fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2)); }
  catch {}
}

function getConfig() {
  if (cachedConfig) return cachedConfig;
  const raw = readRaw();
  cachedConfig = raw ? { ...DEFAULT_CONFIG, ...raw } : { ...DEFAULT_CONFIG };
  return cachedConfig;
}

function setConfig(cfg) {
  cachedConfig = cfg;
  writeRaw(cfg);
}

function getGuild(guildId) {
  const cfg = getConfig();
  return cfg.guilds[guildId] ?? { ...DEFAULT_GUILD };
}

function setGuild(guildId, updates) {
  const cfg = getConfig();
  cfg.guilds[guildId] = { ...(cfg.guilds[guildId] ?? { ...DEFAULT_GUILD }), ...updates };
  setConfig(cfg);
  return cfg.guilds[guildId];
}

function getGiveaway(messageId) {
  return getConfig().giveaways[messageId] ?? null;
}

function saveGiveaway(messageId, data) {
  const cfg = getConfig();
  cfg.giveaways[messageId] = data;
  setConfig(cfg);
}

function deleteGiveaway(messageId) {
  const cfg = getConfig();
  delete cfg.giveaways[messageId];
  setConfig(cfg);
}

function getAllGiveaways() { return getConfig().giveaways; }

function addEntry(messageId, userId) {
  const cfg = getConfig();
  const giveaway = cfg.giveaways[messageId];
  if (!giveaway) return false;
  if (giveaway.entries.includes(userId)) return false;
  giveaway.entries.push(userId);
  setConfig(cfg);
  return true;
}

function getSchedule(id)        { return getConfig().schedules[id] ?? null; }
function getAllSchedules()       { return getConfig().schedules; }

function saveSchedule(id, data) {
  const cfg = getConfig();
  cfg.schedules[id] = data;
  setConfig(cfg);
}

function deleteSchedule(id) {
  const cfg = getConfig();
  delete cfg.schedules[id];
  setConfig(cfg);
}

function getTemplate(id)        { return getConfig().templates[id] ?? null; }
function getAllTemplates()       { return getConfig().templates; }

function saveTemplate(id, data) {
  const cfg = getConfig();
  cfg.templates[id] = data;
  setConfig(cfg);
}

function deleteTemplate(id) {
  const cfg = getConfig();
  delete cfg.templates[id];
  setConfig(cfg);
}

function getGuildTemplates(guildId) {
  return Object.entries(getConfig().templates).filter(([, t]) => t.guildId === guildId);
}

function getUserData(guildId, userId) {
  const guild = getGuild(guildId);
  return guild.levels?.[userId] ?? { xp: 0, level: 0, messages: 0 };
}

function setUserData(guildId, userId, data) {
  const cfg = getConfig();
  if (!cfg.guilds[guildId]) cfg.guilds[guildId] = { ...DEFAULT_GUILD };
  if (!cfg.guilds[guildId].levels) cfg.guilds[guildId].levels = {};
  cfg.guilds[guildId].levels[userId] = data;
  setConfig(cfg);
}

function incrementMessages(guildId, userId) {
  const cfg = getConfig();
  if (!cfg.guilds[guildId]) cfg.guilds[guildId] = { ...DEFAULT_GUILD };
  if (!cfg.guilds[guildId].messageCounts) cfg.guilds[guildId].messageCounts = {};
  const count = (cfg.guilds[guildId].messageCounts[userId] ?? 0) + 1;
  cfg.guilds[guildId].messageCounts[userId] = count;

  if (!cfg.guilds[guildId].messageTimestamps) cfg.guilds[guildId].messageTimestamps = {};
  if (!cfg.guilds[guildId].messageTimestamps[userId]) cfg.guilds[guildId].messageTimestamps[userId] = [];
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  cfg.guilds[guildId].messageTimestamps[userId] = cfg.guilds[guildId].messageTimestamps[userId]
    .filter(ts => ts >= thirtyDaysAgo);
  cfg.guilds[guildId].messageTimestamps[userId].push(now);

  setConfig(cfg);
  return count;
}

function getRecentMessageCounts(guildId, userId) {
  const guild = getGuild(guildId);
  const timestamps = guild.messageTimestamps?.[userId] ?? [];
  const now = Date.now();
  
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;
  const thirtyDays = 30 * oneDay;
  
  const daily = timestamps.filter(ts => ts >= now - oneDay).length;
  const weekly = timestamps.filter(ts => ts >= now - sevenDays).length;
  const monthly = timestamps.filter(ts => ts >= now - thirtyDays).length;
  
  return { daily, weekly, monthly };
}

module.exports = {
  getConfig, setConfig,
  getGuild, setGuild,
  getGiveaway, saveGiveaway, deleteGiveaway, getAllGiveaways, addEntry,
  getSchedule, getAllSchedules, saveSchedule, deleteSchedule,
  getTemplate, getAllTemplates, saveTemplate, deleteTemplate, getGuildTemplates,
  getUserData, setUserData, incrementMessages, getRecentMessageCounts,
};