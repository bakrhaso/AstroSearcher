export function surveyLevelToNumber(surveyLevel) {
	switch (surveyLevel) {
		case "SEEN": return 1
		case "PRELIMINARY": return 2
		case "FULL": return 3
		default: return 0
	}
}