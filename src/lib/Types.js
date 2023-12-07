/**
 * @typedef {object} CampaignEngine
 * @property {CharData} characterData
 * @property {string} seedString
 * @property {ModAndPluginData} modAndPluginData
 */

/**
 * @typedef {object} CharData
 * @property {string} name
 * @property {string} honorific
 * @property {[]} abilities
 * @property {[]} hullMods unlocked hull mods
 */

/**
 * @typedef {object} ModAndPluginData
 * @property {AllModsEverEnabled} allModsEverEnabled
 */

/**
 * @typedef {object} AllModsEverEnabled
 * @property {EnabledModData[]} EnabledModData
 */

/**
 * @typedef {object} EnabledModData
 * @property {ModSpec} spec
 */

/**
 * @typedef {object} ModSpec
 * @property {string} id
 * @property {string} name
 */