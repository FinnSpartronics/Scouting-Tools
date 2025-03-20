document.querySelector("textarea#members").value = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12"
document.querySelector("textarea#positions").value = "Red 1\nRed 2\nRed 3\nBlue 1\nBlue 2\nBlue 3"
document.querySelector("#match_count").value = "70"
document.querySelector("#session_length").value = "10"
document.querySelector("#min_break").value = "3"

let error = document.querySelector("#errors")
let errorAttempts
let errorAttemptsPer = 100

let data = {}

let outName = "Name"
let outMatches = "Matches"

let editing = false

function btn_go() {
    errorAttempts = errorAttemptsPer
    error.innerText = ""
    go()
}
btn_go()

function download() {
    let csv = ""
    csv = `"${outName}","${outMatches}"\n`

    for (let member of Object.keys(data["formatted"])) {
        csv += `"${member}","${data["formatted"][member].trim()}"\n`
    }

    let el = document.createElement("a")
    el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(csv))
    el.setAttribute("download", "assignments.csv")
    el.click()
}

function downloadTable() {
    let el = document.createElement("a")
    el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(jsonToCSV(data["table"])))
    el.setAttribute("download", "assignment_table.csv")
    el.click()
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

function go() {
    let output = document.querySelector("#output")
    output.innerText = ""

    let teamMembers = document.querySelector("textarea").value.split("\n")
    for (let i in teamMembers) teamMembers[i] = teamMembers[i].trim()

    let positions = document.querySelector("textarea#positions").value.split("\n")
    for (let x of positions) x = x.trim()

    let matchesNeeded = parseInt(document.querySelector("#match_count").value)
    let preferredSessionLength = parseInt(document.querySelector("#session_length").value)
    let minBreakLength = parseInt(document.querySelector("#min_break").value)
    output.innerText += teamMembers.length + " members, " + matchesNeeded + " matches\n\n"

    let teamMemberSessions = {}

    //#region Restrictions
    let restrictions = {}
    for (let i in teamMembers) {
        if (teamMembers[i].includes("(")) {
            let unfiltered = teamMembers[i].substring(teamMembers[i].indexOf("("), teamMembers[i].indexOf(")")).trim().replace("(", "").replace(")", "")
            let split = unfiltered.split(",")
            for (let filter in split) {
                split[filter] = split[filter].split("-")
                split[filter][0] = parseInt(split[filter][0].trim())
                split[filter][1] = parseInt(split[filter][1].trim())
            }
            restrictions[i] = split
        }
    }
    //#endregion

    //#region Forced Matches
    let forcedMatches = {}
    for (let i in teamMembers) {
        if (teamMembers[i].includes("[")) {
            let unfiltered = teamMembers[i].substring(teamMembers[i].indexOf("["), teamMembers[i].indexOf("]")).trim().replace("[", "").replace("]", "")
            let split = unfiltered.split(",")
            for (let filter in split) {
                split[filter] = split[filter].split("-")
                split[filter][0] = parseInt(split[filter][0].trim())
                split[filter][1] = parseInt(split[filter][1].trim())
            }
            forcedMatches[i] = split
        }
    }

    let teamMember = 0;

    for (teamMember in teamMembers) {
        teamMemberSessions[teamMember] = []
        if (forcedMatches[teamMember] !== undefined) {
            for (let forced of Object.values(forcedMatches[teamMember])) teamMemberSessions[teamMember].push(forced)
        }
    }
    //#endregion Forced Matches

    //#region Create other sessions
    let matchAssignments = []
    for (let position = 0; position < positions.length; position++) {
        let arr = []

        let takenSlots = []
        for (teamMember in teamMembers) {
            if (forcedMatches[teamMember] !== undefined) {
                for (let forced of Object.values(forcedMatches[teamMember])) {
                    if (forced[2] == position) takenSlots.push(forced)
                }
            }
        }
        takenSlots.sort((a, b) => {return a[0] - b[0]})

        arr.push([1, 2 + Math.ceil(1.4 * Math.random() * (preferredSessionLength - 2)), position])

        for (let match = arr[arr.length - 1][1] + 1 + preferredSessionLength; match < matchesNeeded; match += preferredSessionLength) {
            if (takenSlots.length > 0) {
                let inside = false
                for (let x of takenSlots) {
                    if (x[0] <= match && match <= x[1]) {
                        inside = true
                        if (arr.length > 1) {
                            arr.push([arr[arr.length - 1][1] + 1, x[0] - 1, position])
                            arr.push([x[0], x[1], position, "yes"])
                        }
                        else arr = [[x[0], x[1], position, "yes"]]
                        match = x[1]
                        break
                    }
                }
                if (inside) continue
            }

            arr.push([arr[arr.length - 1][1] + 1, match, position])
        }
        arr.push([arr[arr.length - 1][1] + 1, matchesNeeded, position])
        for (let x of arr) {
            matchAssignments.push(x)
        }
    }
    matchAssignments.sort((a, b) => a[0] - b[0])
    //#endregion Create other sessions

    //#region Assign the sessions to each person

    // Return true if good, false if not
    function checkRestrictions(start, end, member) {
        if (Object.keys(restrictions).includes("" + member)) {
            let list = restrictions["" + member]
            for (let filter of list) {
                if (start >= filter[0] && end <= filter[1]) return true;
            }
            return false;
        } else return true;
    }

    for (let i = 0, member = 0; i < matchAssignments.length; i++) {
        while (!checkRestrictions(matchAssignments[i][0], matchAssignments[i][1], member))
            member = (member + 1) % teamMembers.length
        if (matchAssignments[i].length === 3) teamMemberSessions[member].push(matchAssignments[i])
        member = (member + 1) % (teamMembers.length)
    }

    //#endregion Assign the sessions to each person

    //#region Prepare output and validity check

    data = {
        "table": [],
        "formatted": {},
        "settings": {
            matchesNeeded,
            minBreakLength
        }
    }

    for (let m = 1; m <= matchesNeeded; m++) {
        data["table"].push({"#": m})
    }

    let matchScoutedConfirmation = {}
    for (let position in positions) {
        let x = {}
        for (let m = 0; m <= matchesNeeded; m++) {
            x[m] = 0
        }
        matchScoutedConfirmation[position] = x
    }

    output.innerText = ""
    //#endregion Prepare output and validity check

    //#region Validity check & final processing for data variable
    for (let m in teamMembers) {
        teamMemberSessions[m].sort((a, b) => a[0] - b[0])

        if (teamMembers[m].includes("(")) teamMembers[m] = teamMembers[m].substring(0, teamMembers[m].indexOf("("))
        if (teamMembers[m].includes("[")) teamMembers[m] = teamMembers[m].substring(0, teamMembers[m].indexOf("["))
        name = teamMembers[m]

        let matches = 0
        let outputMatches = ""
        for (let x of teamMemberSessions[m]) {
            outputMatches += x[0] + "-" + x[1] + " " + positions[x[2]] + "\n"
            matches += x[1] - x[0] + 1

            for (let i = x[0]; i <= x[1]; i++) {
                matchScoutedConfirmation[x[2]][0]++
                matchScoutedConfirmation[x[2]][i]++
                data["table"][i - 1][positions[x[2]]] = teamMembers[m]
            }
        }

        data["formatted"][name] = outputMatches
    }

    data["sessions"] = teamMemberSessions
    data["members"] = teamMembers
    data["positions"] = positions
    display()

    if (errorAttempts > 0) {
        for (let position in positions) {
            console.log(matchScoutedConfirmation)
            if (matchScoutedConfirmation[position][0] !== matchesNeeded) {
                errorAttempts--
                go()
                console.log("Matches scouted # mismatch.", matchesNeeded, matchScoutedConfirmation[position][0])
                return
            }
        }
        for (let m in teamMembers) {
            let matches = []
            for (let x of teamMemberSessions[m]) {
                for (let i = x[0]; i <= x[1] + minBreakLength; i++) {
                    if (matches.includes(i)) {
                        errorAttempts--
                        go()
                        //console.log("Scouter assigned same match twice or break too short", i, teamMemberSessions[m])
                        return
                    }
                    matches.push(i)
                }
            }
        }
        for (let member in teamMemberSessions) {
            for (let session of teamMemberSessions[member]) {
                if (session[1] - session[0] < 3) {
                    errorAttempts--
                    go()
                    return
                }
            }
        }
    } else error.innerText = "This will not work :("
    //#endregion Validity check and output
}

function editMode() {
    editing = !editing

    if (editing) displayEdit()
    else display()
}

function displayEdit() {
    let issues = checkValidity()
    if (issues === 0) issues = ""
    console.log(issues)
    document.querySelector("#errors").innerHTML = issues

    let output = document.querySelector("#output")

    output.innerText = ""

    let inputid = 0
    for (let m in data["members"]) {
        let element = document.createElement("div")
        element.className = "memberMatches edit"
        output.appendChild(element)

        element.innerHTML += data["members"][m] + ":"

        let matches = 0
        for (let x of data["sessions"][m]) {
            let session = document.createElement("div")
            element.appendChild(session)

            let start = document.createElement("input")
            start.type = "number"
            start.min = "0"
            start.setAttribute("value", x[0])
            start.className = "edit"
            start.addEventListener("change", change)
            session.appendChild(start)
            inputid++

            let end = document.createElement("input")
            end.type = "number"
            end.min = "0"
            end.setAttribute("value", x[1])
            end.className = "edit"
            end.addEventListener("change", change)
            session.appendChild(end)
            inputid++

            let position = document.createElement("span")
            position.innerText = data.positions[x[2]]
            session.appendChild(position)

            let split = document.createElement("button")
            split.innerText = "Split"
            split.addEventListener("click", () => {
                let i = data["sessions"][m].indexOf(x)
                let middle = data["sessions"][m][i][0] + Math.floor((data["sessions"][m][i][1] - data["sessions"][m][i][0])/2)
                data["sessions"][m].push([middle, data["sessions"][m][i][1], data["sessions"][m][i][2]])
                data["sessions"][m][i][1] = middle - 1
                data["sessions"][m].sort((a,b) => a[0] - b[0])
                displayEdit()
            })
            session.appendChild(split)

            let trade = document.createElement("button")
            trade.innerText = "Move"
            trade.addEventListener("click", () => {
                let moveTo = prompt("Index of whom to move to?")
                if (moveTo === null) return
                console.log(moveTo)
                let i = data["sessions"][m].indexOf(x)
                let result = data["sessions"][m].splice(i, 1)[0]
                data["sessions"][moveTo].push(result)
                data["sessions"][moveTo].sort((a,b) => a[0] - b[0])
                displayEdit()
            })
            session.appendChild(trade)

            function change() {
                let previousSession
                let nextSession
                for (let person in data.sessions) {
                    for (let session in data.sessions[person]) {
                        if (x[2] != data.sessions[person][session][2]) continue
                        if (parseInt(x[0]) - 1 == data.sessions[person][session][1]) previousSession = {
                            "person": person,
                            "session": session
                        }
                        if (parseInt(x[1]) + 1 == data.sessions[person][session][0]) nextSession = {
                            "person": person,
                            "session": session
                        }
                    }
                }

                let modification = "bottom"
                if (x[1] !== parseInt(end.value)) modification = "top"

                if (modification === "bottom") {
                    data.sessions[parseInt(previousSession["person"])][parseInt(previousSession["session"])][1] += parseInt(start.value) - x[0]
                    if (data.sessions[parseInt(previousSession["person"])][parseInt(previousSession["session"])][0] > data.sessions[parseInt(previousSession["person"])][parseInt(previousSession["session"])][1])
                        data.sessions[parseInt(previousSession["person"])].splice(parseInt(previousSession["session"]),1)
                    x[0] += parseInt(start.value) - x[0]
                    displayEdit()
                } else {
                    data.sessions[parseInt(nextSession["person"])][parseInt(nextSession["session"])][0] += parseInt(end.value) - x[1]
                    if (data.sessions[parseInt(nextSession["person"])][parseInt(nextSession["session"])][0] > data.sessions[parseInt(nextSession["person"])][parseInt(nextSession["session"])][1])
                        data.sessions[parseInt(nextSession["person"])].splice(parseInt(nextSession["session"]),1)
                    x[1] += parseInt(end.value) - x[1]
                    displayEdit()
                }
            }

            matches += x[1] - x[0] + 1
        }

        let total = document.createElement("div")
        total.innerHTML += "<br/>" + matches + " total matches"
        element.appendChild(total)
    }
}

function display() {
    let output = document.querySelector("#output")

    output.innerText = ""

    for (let m in data["members"]) {
        let element = document.createElement("div")
        element.className = "memberMatches"
        element.innerHTML = ""

        element.innerHTML += data["members"][m] + ":"

        let matches = 0
        let outputMatches = ""
        for (let x of data["sessions"][m]) {
            element.innerHTML += "<br/>ㅤㅤ" + x[0] + "-" + x[1] + " " + data["positions"][x[2]]
            outputMatches += x[0] + "-" + x[1] + " " + data["positions"][x[2]] + "\n"
            matches += x[1] - x[0] + 1
        }
        element.innerHTML += "<br/>" + matches + " total matches"

        output.appendChild(element)
    }
}

function checkValidity() {
    let matchScoutedConfirmation = {}
    for (let position in data.positions) {
        let x = {}
        for (let m = 0; m <= data.settings.matchesNeeded; m++) {
            x[m] = 0
        }
        matchScoutedConfirmation[position] = x
    }

    for (let m in data.members) {
        data.sessions[m].sort((a, b) => a[0] - b[0])

        let matches = 0
        let outputMatches = ""
        for (let x of data.sessions[m]) {
            outputMatches += x[0] + "-" + x[1] + " " + data.positions[x[2]] + "\n"
            matches += x[1] - x[0] + 1

            for (let i = x[0]; i <= x[1]; i++) {
                matchScoutedConfirmation[x[2]][0]++
                matchScoutedConfirmation[x[2]][i]++
                data["table"][i - 1][data.positions[x[2]]] = data.members[m]
            }
        }

        data["formatted"][data.members[m]] = outputMatches
    }

    /*for (let position in data.positions) {
        if (matchScoutedConfirmation[position][0] !== data.settings.matchesNeeded) {
            return 1
        }
    }*/
    for (let m in data.members) {
        let matches = []
        for (let x of data.sessions[m]) {
            for (let i = x[0]; i <= x[1] + data.settings.minBreakLength; i++) {
                if (matches.includes(i)) {
                    return 2
                }
                matches.push(i)
            }
        }
    }
    for (let member in data.sessions) {
        for (let session of data.sessions[member]) {
            if (session[1] - session[0] < 3) {
                return 3
            }
        }
    }
    return 0
}