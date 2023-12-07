/**
 * @template T
 * @param {T[]} arr
 * @param {(T) => string} keyFun
 * @returns {Record<string, T[]>}
 */
export function groupBy(arr, keyFun) {
	return arr.reduce((accumulated, current) => {
		const key = keyFun(current)
		accumulated[key] == null ? accumulated[key] = [current] : accumulated[key].push(current)
		return accumulated
	}, {})
}

/**
 * @param {string} a
 * @param {string} b
 * @param {"ASC"|"DESC"} order
 * @return number
 */
export function stringComparator(a, b, order = "ASC") {
	const orderNum = order === "ASC" ? 1 : -1
	if (a > b) {
		return orderNum
	} else if (b > a) {
		return -orderNum
	} else {
		return 0
	}
}
