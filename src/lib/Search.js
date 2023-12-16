import { bodies } from "$lib/saveReader.js"

export function search(filter) {
	console.log(filter)
	const start = performance.now()

	/**
	 * @type Colony[]
	 */
	const colonies = Object.values(filter)
	const candidates = []

	for (const colony of colonies) {
		for (const [_id, body] of Object.entries(bodies)) {
			if (body.prefilterStructures(colony)) {
				candidates.push(body)
			}
		}
	}

	console.log({ candidates })

	const end = performance.now()
	console.log(`Searching took ${end - start} ms`)
}