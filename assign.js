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
        if (teamMembers[i].includes("(")) {
            let unfiltered = teamMembers[i].substring(teamMembers[i].indexOf("("), teamMembers[i].length).trim().replace("(", "").replace(")", "")
            let split = unfiltered.split(",")
            for (let filter in split) {
                split[filter] = split[filter].split("-")
                split[filter][0] = parseInt(split[filter][0].trim())
                split[filter][1] = parseInt(split[filter][1].trim())
            }
            restrictions[i] = split
        }
    }

    let matchesNeeded = parseInt(document.querySelector("#match_count").value) * 6

    let preferredSessionLength = parseInt(document.querySelector("#session_length").value) - 1

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

    console.log(restrictions)
    // Returns false if valid, true if not
    function checkRestrictions(start, end, member) {
        if (Object.keys(restrictions).includes("" + member)) {
            let list = restrictions["" + member]
            for (let filter of list) {
                if (start >= filter[0] && end <= filter[1]) return false;
            }
            return true;
        } else return false;
    }

    let teamMember = 0;
    let teamMemberOutputs = {}
    let teamMemberSessions = {}
    for (let x = 0; x < teamMembers.length; x++) {
        teamMemberOutputs[x] = teamMembers[x] + ": "
        teamMemberSessions[x] = []
    }
    for (let m = 0; m < sessionMatches.length; m++) {
        while (checkRestrictions(sessionMatches[m][0], sessionMatches[m][1], teamMember))
            teamMember = (teamMember + 1) % teamMembers.length
        teamMemberOutputs[teamMember] += " [" + sessionMatches[m][0] + "," + sessionMatches[m][1] + "," + sessionMatches[m][2] + "],"
        teamMemberSessions[teamMember].push(sessionMatches[m])
        teamMember = (teamMember + 1) % teamMembers.length
    }
    console.log(teamMemberOutputs)

    let missedMatchesTest = {}
    for (let i = 1; i <= matchesNeeded/6; i++) {
        missedMatchesTest[i] = 0
    }

    for (let x in teamMemberSessions) {
        let name = teamMembers[x]
        if (name.includes("(")) name = name.substring(0, name.indexOf("(")).trim()
        output.innerText += name + ": "
        
        let matchesScouted = 0
        let lastMatch = -100;
        let overlap = false;

        for (let session of teamMemberSessions[x]) {
            output.innerText += " " + JSON.stringify(session) + ","
            matchesScouted += session[1] - session[0] + 1
            for (let i = session[0]; i <= session[1]; i++) {
                missedMatchesTest[i]++;
            }

            if (lastMatch > session[1]) overlap = true;
            lastMatch = session[1]
        }

        output.innerText += " (" + matchesScouted + " matches)"
        if (overlap)
            output.innerText += "     (OVERLAP)"
        output.innerText += "\n"
        
    }

    output.innerText += "\n\n"

    for (let x in missedMatchesTest) {
        if (missedMatchesTest[x] !== 6)
            output.innerText += "Match " + x + " is being scouted " + missedMatchesTest[x] + " times.\n"
    }

    

}