let teams = {
    left: {},
    right: {}
}

let startMoney = {};
let prevRound = 0;
let freezeTime = false;

function populateObserved(playerData) {
    let stats = playerData.getStats()
    let weapons = playerData.weapons

    $("#player-container")
        .removeClass("t ct")
        .addClass(playerData.team.toLowerCase());

    $("#player-name").html(playerData.name)

    
    $("#nades").html("")

    for (let key in weapons) {
        let weapon = weapons[key]
        if (weapon.type == "Grenade") {
            for (let x = 0; x < weapon.ammo_reserve; x++) {
                $("#nades").append($("<img />").attr("src", "/files/img/grenades/" + weapon.name + ".png"));
            }
        }
        if (weapon.state == "active" || weapon.state == "reloading") {
            if (weapon.type == "Grenade" || weapon.type == "C4" || weapon.type == "Knife" || statistics.health == 0) {
                $(".clip").html("");
                $(".reserve").html("");
            } else {
                $(".clip").html(weapon.ammo_clip + "/")
                $(".reserve").html(weapon.ammo_reserve)
            }
        }
    }
    $("#armor-text").html(statistics.armor)
    $("#health-text").html(statistics.health)
    $("#armor-text")
        .removeClass("armor helmet")
        .addClass(statistics.helmet
            ? "helmet"
            : "armor")
}

function populateTeamInfo(teams) {
    $("#team-1-name").text(teams.left.name)
    $("#team-2-name").text(teams.right.name)
}

function populateSeriesBar(matchType, matchInfo) {
    $("#series-detail").text("Best of " + matchType.substr(2));
    $("#team-1-series").empty()
    $("#team-2-series").empty()

    let leftWins = matchInfo.team_1.map_score
    let rightWins = matchInfo.team_2.map_score
    let totalMatches = Math.round(matchType.substr(2) / 2)

    for (let i = 0; i < totalMatches; i++) {
        // Populate Left team wins
        if (leftWins > i) {
            // Add a win block
            $("#team-1-series").append("<div class='series-block win'></div>")
        } else {
            // Add a blank block
            $("#team-1-series").append("<div class='series-block'></div>")
        }

        // Populate Right team wins
        if (rightWins > i) {
            // Add a win block
            $("#team-2-series").prepend("<div class='series-block win'></div>")
        } else {
            // Add a blank block
            $("#team-2-series").prepend("<div class='series-block'></div>")
        }
    }
}

function updatePage(data) {
    let observed = data.getObserved()
    let matchType = data.getMatchType()
    let matchInfo = data.getMatch()
    let phase = data.phase()
    let players = data.getPlayers()
    let round = data.round()
    let map = data.map()
    
    let testPlayerTwo = data.getPlayer(1)
    let teamCT = data.getCT()
    let teamT = data.getT()

    // Set up teams dict
    if (testPlayerTwo) {
        let teamOne = data.getTeamOne()
        let teamTwo = data.getTeamTwo()

        left = testPlayerTwo.team.toLowerCase() === "ct" ? teamCT : teamT
        right = testPlayerTwo.team.toLowerCase() !== "ct" ? teamCT : teamT

        teams.left.side = left.side || null
        teams.right.side = right.side || null

        teams.left.name = teamOne.team_name || left.name
        teams.right.name = teamTwo.team_name || right.name

        teams.left.score = left.score
        teams.right.score = right.score
        teams.left.mapScore = teamOne.map_score || 0
        teams.right.mapScore = teamTwo.map_score || 0

        if (left.side === "ct") {
            $("#team-1-series").addClass("ct")
            $("#team-2-series").addClass("t")
        } else {
            $("#team-1-series").addClass("t")
            $("#team-2-series").addClass("ct")
        }

        populateTeamInfo(teams);
    }

    let currRound = map.round + (round.phase == "over" || round.phase == "intermission"
        ? 0
        : 1)

    if ((round.phase == "freezetime" && !freezeTime) || currRound != prevRound) {
        startMoney = {};
    }

    // Round
    $("#round-counter").html("Round " + currRound + " / 30");
    
    // Score
    $("#team-1-score").html(teams.left.score);
    $("#team-2-score").html(teams.right.score);

    // Series Bar
    if (matchType && matchType.toLowerCase() !== "none" && matchInfo) {
        populateSeriesBar(matchType, matchInfo, teams);
    } else {
        // Match is a BO1. Hide the series bar
        $("#series-info").hide();
    }

    // Observed Player
    if (observed && observed.steamid != 1 && observed.getStats()) {
        populateObserved(observed);
    }

    // Phase
    if (phase) {
        $("#time-counter").css("color", (phase.phase == "live" || phase.phase == "over" || phase.phase == "warmup" || (phase.phase == "freezetime" && phase.phase_ends_in > 10))
            ? "black"
            : "red");

        if (phase.phase_ends_in) {
            let countDown = Math.abs(Math.ceil(phase.phase_ends_in))
            let countMinutes = Math.floor(countDown / 60)
            let countSeconds = countDown - (countMinutes * 60)

            if (countSeconds < 10) {
                countSeconds = "0" + countSeconds;
            }

            if (phase.phase === "bomb" || phase.phase === "defuse") {
                $("#time-counter").text("").addClass("bomb-timer")
            } else {
                $("#time-counter").text(countMinutes + ":" + countSeconds).removeClass("bomb-timer")
            }
        }
    }

    freezeTime = round.phase == "freezetime";
    prevRound = currRound
}