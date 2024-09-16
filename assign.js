document.querySelector("textarea").value = "a\nb\nc\nd\ne\nf\ng\nh\ni(1-20)"
document.querySelector("#match_count").value = "60"
document.querySelector("#session_length").value = "10"

let showDebug = false

go()

function go() {
    let output = document.querySelector("#output")
    output.innerText = ""

    let teamMembers = document.querySelector("textarea").value.split("\n")
    for (let i in teamMembers) teamMembers[i] = teamMembers[i].trim()

    let restrictions = {}
    for (let i in teamMembers) {
        if (teamMembers[i].includes("(")) { // Restriction Detected
            let restriction = teamMembers[i].substring(teamMembers[i].indexOf("("), teamMembers[i].length).trim().replace("(", "").replace(")", "")
            restriction = restriction.split(",")
            for (let i in restriction) {
                restriction[i] = restriction[i].split("-")
                for (let x in restriction[i])
                    restriction[i][x] = restriction[i][x].trim()
            }
            console.log(restriction)
        }
    }

    let matchesNeeded = parseInt(document.querySelector("#match_count").value) * 6

    let preferredSessionLength = parseInt(document.querySelector("#session_length").value)

    output.innerText += teamMembers.length + " members, " + matchesNeeded + " matches" + ", ~" + matchesNeeded/preferredSessionLength + " sessions\n\n"

    let sessions = []
    let memberOn = 0
    while (sessions.length < matchesNeeded/preferredSessionLength) {
        sessions.push(teamMembers[memberOn])
        memberOn = (memberOn + 1) % teamMembers.length
    }
    output.innerText += sessions + "\n\n"

    let sessionMatches = []
    for (let i = 0; i < 6; i++) sessionMatches.push([0, 2 * (i+1), i])

    while (sessionMatches[sessionMatches.length-6][1] < matchesNeeded / 6) {
        let previous = sessionMatches[sessionMatches.length - 6][1] + 1

        let ending = Math.min(previous + preferredSessionLength, matchesNeeded / 6 - 1)
        if (ending >= matchesNeeded / 6 - 3) ending = matchesNeeded / 6
        sessionMatches.push([previous, ending, sessionMatches[sessionMatches.length-6][2]])
    }

    for (let match of sessionMatches) {
        match[0]++
        match[1]++
        match[1] = Math.min(match[1], matchesNeeded / 6)
        output.innerText += "[" + match[0] + "," + match[1] + ", " + match[2] + "], "
    }

    if (showDebug)
        output.innerText += "\n\n----- Final Output -----\n\n"
    else
        output.innerText = " "

    let avMatchesScouted = 0
    for (let m = 0; m < teamMembers.length; m++) {
        output.innerText += teamMembers[m] + ": "
        let matchesScouted = 0
        for (let i = m; i < sessionMatches.length; i += teamMembers.length) {
            output.innerText += " [" + sessionMatches[i][0] + "," + sessionMatches[i][1] + "," + sessionMatches[i][2] + "],"
            matchesScouted += sessionMatches[i][1] - sessionMatches[i][0] + 1
        }
        output.innerText += " " + matchesScouted + " matches\n"
        avMatchesScouted += matchesNeeded
    }

    let m = {}
    for (let i = 1; i <= matchesNeeded / 6; i++) {
        m[i] = 0
        for (let session of sessionMatches)
            if (session[1] >= i && i >= session[0]) m[i]++
        if (m[i] !== 6) {
            output.innerText += "Error: match " + i + " is missing at least one scouter. \n"
            console.log(m)
        }
    }
    output.innerText += "\n\n"

    //avMatchesScouted /= teamMembers.length
    //avMatchesScouted /= teamMembers.length
    //output.innerText += "Average matches scouted per person: " + avMatchesScouted
}