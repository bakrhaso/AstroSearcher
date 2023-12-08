/**
 * @typedef {object} CampaignEngine
 * @property {CharData} characterData
 * @property {string} seedString
 * @property {ModAndPluginData} modAndPluginData
 * @property {Hyperspace} hyperspace
 */

/**
 * @typedef {object} Hyperspace
 * @property {HyperspaceO} o
 */

/**
 * @typedef {object} HyperspaceO
 * @property {Saved} saved
 */

/**
 * @typedef	{object} Saved
 * @property {LocationToken[]} LocationToken
 */

/**
 * @typedef {object} LocationToken
 * @property {Orbit} orbit
 */

/**
 * @typedef {object} Orbit
 * @property {OrbitS} s
 */

/**
 * @typedef {object} OrbitS
 * @property {OrbitSO} o
 * @property {OrbitSCon} con
 */

/**
 * @typedef {object} OrbitSO
 * @property {OSaved} saved
 */

/**
 * @typedef	{object} OrbitSCon
 * @property {Systems} systems
 */

/**
 * @typedef {object} Systems
 * @property {Sstm[]} Sstm
 */

/**
 * @typedef {object} Sstm
 * @property {SstmO} o
 */

/**
 * @typedef {object} SstmO
 * @property {OSaved} saved
 */

/**
 * @typedef {object} OSaved
 * @property {Plnt[] | Plnt} Plnt
 */

/**
 * @typedef {object} Plnt
 * @property {Market} market
 */

/**
 * @typedef {object} Market
 * @property {Cond} cond Contains the conditions of the Market including stuff the player hasn't surveyed yet
 * @property {Surveyed} [surveyed] Contains only the conditions the player has surveyed
 * @property {"SEEN" | "PRELIMINARY" | "FULL"} [surveyLevel] How much it has been surveyed. The surveyed property is still there even if this is missing, so I'm not sure which is correct.
 */

/**
 * @typedef {object} Surveyed
 * @property {string[]} [st] The conditions themselves, e.g. extreme_weather. Some planets have no conditions.
 */

/**
 * @typedef {object} Cond
 * @property {string[]} [st] The conditions themselves, e.g. volatiles_trace. Some planets have no conditions.
 * Mods seem to usually prefix their conditions. Here are the prefixes I've noticed:
 * - Industrial.Evolution: IndEvo_
 * - Unknown Skies: US_
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