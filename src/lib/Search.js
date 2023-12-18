import { bodies } from "$lib/saveReader.js"
import * as R from "ramda"

export function search(globalSettings, filter) {
	console.log(filter)
	const start = performance.now()

	/**
	 * @type Colony[]
	 */
	const colonies = Object.values(filter)
	// a list per colony that contains planets that colony could be on
	const colonyCandidates = []

	for (const colony of colonies) {
		// a list of planets the current colony could be on
		const planetCandidates = []
		for (const [_id, body] of Object.entries(bodies)) {
			if (body.prefilterStructures(colony)) {
				planetCandidates.push(body)
			}
		}
		colonyCandidates.push(planetCandidates)
	}

	// globalSettings.coloniesDistanceApart, 0 = same system
	for (const planets of cartesianIterator(...colonyCandidates)) {
		// every planet in planets is for a different colony
		const windows = R.aperture(2, planets)
		for (const [left, right] of windows) {
			const distance = Math.sqrt((left.system.x - right.system.x)**2 + (left.system.y - right.system.y)**2)
			console.log(distance)
		}
	}

	const end = performance.now()
	console.log(`Searching took ${end - start} ms`)
}

/**
 * https://stackoverflow.com/a/44344803
 * @param head
 * @param tail
 * @return {Generator<*[], void, *>}
 */
function* cartesianIterator(head, ...tail) {
	const remainder = tail.length > 0 ? cartesianIterator(...tail) : [[]]
	for (let r of remainder) {
		for (let h of head) {
			yield [h, ...r]
		}
	}
}

// get values:
// const cartesian = items => [...cartesianIterator(items)];
// console.log(cartesian(input));