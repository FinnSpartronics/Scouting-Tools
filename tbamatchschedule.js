let loading = 0

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

async function load(sub, onload) {
    let key = document.querySelector("#api").value
    let url = (`https://www.thebluealliance.com/api/v3/${sub}?X-TBA-Auth-Key=${key}`)

    loading++
    await fetch(url).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        loading--
        return response.json()
    }).then(data => {
        onload(data)
    })
}

function download(filename, text) {
    let el = document.createElement("a")
    el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text))
    el.setAttribute("download", filename)
    el.click()
}

function go() {
    let event = document.querySelector("#event").value
    load("event/"+event+"/matches", (data) => {
        let matches = []
        for (let x of data) {
            if (x["comp_level"] !== "qm") continue
            let red1 = x["alliances"]["red"]["team_keys"][0].substring(3)
            let red2 = x["alliances"]["red"]["team_keys"][1].substring(3)
            let red3 = x["alliances"]["red"]["team_keys"][2].substring(3)
            let blue1 = x["alliances"]["blue"]["team_keys"][0].substring(3)
            let blue2 = x["alliances"]["blue"]["team_keys"][1].substring(3)
            let blue3 = x["alliances"]["blue"]["team_keys"][2].substring(3)
            matches.push({
                "match": parseInt(x["match_number"]),
                "Red 1": red1,
                "Red 2": red2,
                "Red 3": red3,
                "Blue 1": blue1,
                "Blue 2": blue2,
                "Blue 3": blue3,
                "Summary of Teams": `Red: ${red1}, ${red2}, ${red3}\nBlue: ${blue1},${blue2},${blue3}`
            })
        }
        matches = matches.sort((a, b) => a["match"] - b["match"])
        download(`match_schedule${event}.csv`, jsonToCSV(matches))
    })
}

function downloadTeams() {
    let event = document.querySelector("#event").value
    load("event/"+event+"/teams", (data) => {
        let teams = []
        for (let x of data) {
            teams.push({
                "Team Number": x["team_number"],
                "Pit scouted": false,
                "Name": x["nickname"],
                "image": "",
            })
        }
        teams = teams.sort((a, b) => a["Team Number"] - b["Team Number"])
        download(`teams${event}.csv`, jsonToCSV(teams))
    })
}

document.querySelector("button#main").addEventListener("click", go)
document.querySelector("button#teams").addEventListener("click", downloadTeams)