import { writable } from "svelte/store"

/**
 * @type {Writable<Record<number, ColonyFilter>>}
 */
export let colonyFilterStore = writable({})

/**
 * @typedef {object} ColonyFilter
 * @property {Set<string>} planetTypeDisplayNames
 * @property {Set<string>} conditions
 */