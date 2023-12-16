// warning supressed so we get the correct type in our JSDoc
// eslint-disable-next-line no-unused-vars
import { Body } from "$lib/Body.js"

/**
 * @typedef System
 * @property {string} name
 * @property {number} x
 * @property {number} y
 * @property {string[]} tags
 * @property {Body[]} bodies
 * @property {any[]} stars
 * @property {boolean} [coronalTap]
 * @property {boolean} [coronalTapDiscovered]
 * @property {boolean} [cryosleeper]
 * @property {boolean} [cryosleeperDiscovered]
 */

/**
 * @typedef Colony
 * @property {Set<string>} planetTypes
 * @property {{exact: Map, gte: Map}} conditions
 * @property {Set} resources
 * @property {Set} buildings
 * @property {boolean} hasGate
 * @property {boolean} hasRelay
 */
