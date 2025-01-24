document.querySelector("textarea#members").value = "a\nb\nc\nd\ne\nf\ng\nh[40-60-1,1-20-1](0-0)\ni(1-20)"
document.querySelector("textarea#positions").value = "Red Front\nRed Middle\nRed Back\nBlue Front\nBlue Middle\nBlue Back"
document.querySelector("#match_count").value = "70"
document.querySelector("#session_length").value = "10"

let showDebug = false

go()

function go() {
    let output = document.querySelector("#output")
    output.innerText = ""

    let teamMembers = document.querySelector("textarea").value.split("\n")
    for (let i in teamMembers) teamMembers[i] = teamMembers[i].trim()

    let positions = document.querySelector("textarea#positions").value.split("\n")
    for (let x of positions) x = x.trim()

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

    let matchesNeeded = parseInt(document.querySelector("#match_count").value)
    let preferredSessionLength = parseInt(document.querySelector("#session_length").value)

    output.innerText += teamMembers.length + " members, " + matchesNeeded + " matches\n\n"

    let teamMember = 0;
    let teamMemberOutputs = {}
    let teamMemberSessions = {}

    for (teamMember in teamMembers) {
        teamMemberSessions[teamMember] = []
        if (forcedMatches[teamMember] !== undefined) {
            for (let forced of Object.values(forcedMatches[teamMember])) teamMemberSessions[teamMember].push(forced)
        }
    }

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

    // Assign the matches to each person

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

    let matchScoutedConfirmation = {}
    for (let position in positions) {
        let x = {}
        for (let m = 1; m <= matchesNeeded; m++) {
            x[m] = 0
        }
        matchScoutedConfirmation[position] = x
    }

    output.innerText = ""
    for (let m in teamMembers) {
        let element = document.createElement("div")
        element.className = "memberMatches"
        element.innerHTML = ""

        teamMemberSessions[m].sort((a, b) => a[0] - b[0])

        let name = teamMembers[m]
        if (name.includes("(")) name = name.substring(0, name.indexOf("("))
        if (name.includes("[")) name = name.substring(0, name.indexOf("["))

        element.innerHTML += name + ":"

        let matches = 0
        for (let x of teamMemberSessions[m]) {
            element.innerHTML += "<br/>ㅤㅤ" + x[0] + "-" + x[1] + " " + positions[x[2]]
            matches += x[1] - x[0] + 1

            for (let i = x[0]; i <= x[1]; i++) {
                matchScoutedConfirmation[x[2]][i]++
            }
        }
        element.innerHTML += "<br/>" + matches + " total matches"

        output.appendChild(element)
    }

    // TODO: Check to make sure that no team members have overlap
    // TODO: Make the no overlap with the forced sessions

    console.log(matchScoutedConfirmation)



}