document.querySelector("textarea#members").value = "a\nb\nc\nd\ne\nf\ng\nh[40-60-1,1-20-1](1-20)\ni(1-20)"
document.querySelector("textarea#positions").value = "Red Front\nRed Middle\nRed Back\nBlue Front\nBlue Middle\nBlue Back"
document.querySelector("#match_count").value = "60"
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
    console.log("forced", forcedMatches)

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
        console.log(positions[position], takenSlots)

        arr.push([1, 2 + Math.ceil(1.4 * Math.random() * (preferredSessionLength - 2))])
        for (let match = arr[arr.length - 1][1] + 1 + preferredSessionLength; match < matchesNeeded; match += preferredSessionLength) {
            if (takenSlots.length > 0) {
                let curr = -1
                let i = 0
                while (takenSlots[i][0] <= match) {
                    if (takenSlots[i][0] <= match) curr = takenSlots[i]
                    i++
                }
                if (match < curr[1]) {
                    arr.push(curr)
                    match = curr[1]
                    continue
                }
            }

            arr.push([arr[arr.length - 1][1] + 1, match])
        }
        arr.push([arr[arr.length - 1][1] + 1, matchesNeeded])

        matchAssignments.push(arr)
    }
    console.log(matchAssignments)


}