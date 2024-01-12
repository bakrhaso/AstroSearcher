onmessage = (e) => {
	const saveFile = e.data
	const reader = new FileReader()

	reader.onload = async function(event) {
		try {
			const save = event.target.result
			self.postMessage({ save })
		} catch (err) {
			self.postMessage({ error: err.message })
		}
	}


	reader.onerror = function(error) {
		self.postMessage({ error: error.message })
	}

	reader.readAsText(saveFile)
}