let data

const presetsKey = "4915_Scouting_Sanitizer_Presets"

function setPresetsEl() {
    let presets = document.querySelector(".presets")
    presets.innerHTML = `<h3>Presets</h3> <button id="saveCurrent">Save Current as Preset</button>`

    document.querySelector("#saveCurrent").addEventListener("click", () => {
        let name = prompt("What should this preset be called?")
        if (name === null) return
        name = name.toUpperCase()
        if (localStorage.getItem(presetsKey) !== null) {
            let savedPresets = JSON.parse(localStorage.getItem(presetsKey))
            savedPresets[name] = {
                "deletes": document.querySelector("#deletes").value,
                "clears": document.querySelector("#clears").value
            }
            console.log(savedPresets)
            localStorage.setItem(presetsKey, JSON.stringify(savedPresets))
        } else {
            let newPresets = {}
            newPresets[name] = {
                "deletes": document.querySelector("#deletes").value,
                "clears": document.querySelector("#clears").value
            }
            console.log(newPresets)
            localStorage.setItem(presetsKey, JSON.stringify(newPresets))
        }

        setPresetsEl()
    })

    console.log(localStorage.getItem(presetsKey))
    if (localStorage.getItem(presetsKey) !== null) {
        let savedPresets = JSON.parse(localStorage.getItem(presetsKey))
        for (let x in savedPresets) {
            let presetEl = document.createElement("div")
            presetEl.innerHTML = `
                <span>${x}</span>
                <button id="load-${x}">Load</button>
                <button id="delete-${x}">Delete</button>
            `
            presets.appendChild(presetEl)

            document.querySelector(`#load-${x}`).addEventListener("click", () => {
                document.querySelector("#deletes").value = savedPresets[x].deletes
                document.querySelector("#clears").value = savedPresets[x].clears
            })

            document.querySelector(`#delete-${x}`).addEventListener("click", () => {
                if (!confirm("you sure you want to delete?")) return
                delete savedPresets[x]
                localStorage.setItem(presetsKey, JSON.stringify(savedPresets))
                setPresetsEl()
            })
        }
    }
}
setPresetsEl()

function setFieldsDiv() {
    let fields = document.querySelector("#fields")
    fields.innerText = ""
    for (let key of Object.keys(data[0])) {
        fields.innerText += key+"\n"
    }
}
function sanitize() {
    for (let x of data) {
        for (let fields of document.querySelector("#deletes").value.split("\n")) {
            delete x[fields]
        }
        for (let fields of document.querySelector("#clears").value.split("\n")) {
            x[fields] = ""
        }
    }
    setFieldsDiv()
}

function loadFile(accept, listener) {
    let fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = accept
    fileInput.addEventListener("change", (e) => {
        const reader = new FileReader()
        reader.onload = (loadEvent) => {
            listener(loadEvent.target.result, filename.split('.').pop().toLowerCase())
        }
        let filename = e.target.files[0].name
        reader.readAsText(e.target.files[0])
    })
    fileInput.click()
}

function download(filename, text) {
    let el = document.createElement("a")
    el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text))
    el.setAttribute("download", filename)
    el.click()
}

function csvToJson(csv) {
    let rawFields = csv.split("\n")[0]

    let fields = []
    let inQuote = false
    let current = ""
    for (let char of rawFields) {
        if (char === '"') inQuote = !inQuote
        else if (char === ',' && !inQuote) {
            fields.push(current.trim())
            current = ""
        } else current = current + char
    }
    fields.push(current)

    let str = ""
    inQuote = false
    for (let substring of csv.split("\n").slice(1)) {
        for (let char of substring) {
            str = str + char
            if (char === '"') inQuote = !inQuote
        }
        if (!inQuote) str = str + ","
        str = str + "\n"
        //inQuote = false
    }

    let json = []
    current = ""
    let currentMatch = {}
    inQuote = false
    for (let char of str) {
        if (char === '"') inQuote = !inQuote
        if (char === ',' && !inQuote) {
            current = current.trim()
            if (current.startsWith('"')) current = current.substring(1)
            if (current.endsWith('"')) current = current.substring(0, current.length - 1)
            current = current.replaceAll('""', '"').trim()
            if (!isNaN(parseFloat(current.replaceAll(",", "")))) current = parseFloat(current.replaceAll(",", ""))
            currentMatch[fields[Object.keys(currentMatch).length]] = current

            current = ""
            if (Object.keys(currentMatch).length === fields.length) {
                json.push(currentMatch)
                currentMatch = {}
            }
        } else current = current + char
    }

    return json
}

function jsonToCSV(json) {
    function item(x) {
        if (typeof x === "string") {
            return '"' + x.replaceAll('"', '\\"') + '"'
        } else return x
    }

    let csv = []
    let currentLine = ""

    for (let key of Object.keys(json[0])) {
        currentLine += item(key)+","
    }
    currentLine = currentLine.substring(0, currentLine.length - 1)
    csv.push(currentLine)
    currentLine = ""

    for (let i = 0; i < json.length; i++) {
        for (let val of Object.values(json[i])) {
            currentLine += item(val)+","
        }
        currentLine = currentLine.substring(0, currentLine.length - 1)
        csv.push(currentLine)
        currentLine = ""
    }

    return csv.join("\n")
}

function loadCSV() {
    loadFile(".csv", (result) => {
        data = csvToJson(result)
        setFieldsDiv()
    })
}
function loadJSON() {
    loadFile(".json", (result) => {
        data = JSON.parse(result)
        setFieldsDiv()
    })
}
function downloadJSON() {
    download("sanitized.json", JSON.stringify(data))
}
function downloadCSV() {
    download("sanitized.csv", jsonToCSV(data))
}

document.querySelector("#ucsv").addEventListener("click",loadCSV)
document.querySelector("#ujson").addEventListener("click",loadJSON)
document.querySelector("#sanitize").addEventListener("click",sanitize)
document.querySelector("#dcsv").addEventListener("click",downloadCSV)
document.querySelector("#djson").addEventListener("click",downloadJSON)