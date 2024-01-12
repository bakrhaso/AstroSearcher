import { bodies } from "$lib/save-reader.js"
import * as R from "ramda"

/**
 *
 * @param globalSettings
 * @param {Record<string, Colony>} filter
 */
export function search(globalSettings, filter) {
	console.log(filter)
	const start = performance.now()

	/**
	 * @type Colony[]
	 */
	const colonies = Object.values(filter)
	/**
	 * A list per colony that contains planets that colony could be on
	 * @type {Body[][]}
	 */
	const colonyCandidates = []

	for (const colony of colonies) {
		/**
		 * A list of planets the current colony could be on
		 * @type {Body[]}
		 */
		const planetCandidates = []
		for (const [_id, body] of Object.entries(bodies)) {
			if (body.prefilterStructures(colony)) {
				planetCandidates.push(body)
			}
		}
		colonyCandidates.push(planetCandidates)
	}

	console.log({ colonyCandidates })

	/**
	 * colonyCandidates is something like this (every array can have a different amount of entries):
	 * [
	 *     [ P1, P2, P3 ], // Colony A
	 *     [ P1, P4, P5 ], // Colony B
	 * ]
	 * They can have planets in common in the planet matches the criteria
	 * of multiple colonies.
	 *
	 * We want to generate sets that contains every combination of planets
	 * from each colony. In the above example, we would want the following:
	 * [
	 *  // [ Col A, Col B ]
	 *     [ P1, P1 ],
	 *     [ P1, P4 ],
	 *     [ P1, P5 ],
	 *     [ P2, P1 ],
	 *     [ P2, P4 ],
	 *     [ P2, P5 ],
	 *     [ P3, P1 ],
	 *     [ P3, P4 ],
	 *     [ P3, P5 ],
	 * ]
	 */

	const validColonies = []
	/**
	 * Calculate every possible combination to find optimal combination of systems.
	 * globalSettings.coloniesDistanceApart, 0 = same system
	 */
	for (const planets of cartesianIterator(...colonyCandidates)) {
		console.log({ planets })

		// TODO this case doesnt really need the product of the cartesianIterator,
		// so we should find a way to make this for-loop smarter, maybe.
		if (planets.length === 1) {
			validColonies.push(planets[0])
		}

		// every planet in planets is for a different colony
		const windows = R.aperture(2, planets)

		for (const [left, right] of windows) {
			console.log({ left, right })
			if (left.id === right.id) continue

			const distance = Math.sqrt((left.system.x - right.system.x)**2 + (left.system.y - right.system.y)**2)

			if (distance <= globalSettings.coloniesDistanceApart) {
				validColonies.push(left, right)
			}
		}
	}

	console.log({ validColonies })

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
