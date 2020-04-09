let teams = {
    left: {},
    right: {}
}

let startMoney = {};
let prevRound = 0;
let freezeTime = false;

let isDefusing = false;

let bombTicking = false;
let currBombTime = 0
let bombInterval

function startBomb(bombTime) {
    bombTicking = true
    $("#bomb-progress").css("visibility", "visible")
    $("#bomb-progress").css("width", "353px")
    currBombTime = bombTime
    bombInterval = setInterval(function () {
        $("#bomb-progress").css("width", 353 * currBombTime / bombTime + "px")
        currBombTime -= 0.01
        if (currBombTime <= 0) {
            stopBomb()
        }
    }, 10)
}

function stopBomb() {
    bombTicking = false
    clearInterval(bombInterval)
    $("#bomb-progress").css("visibility", "hidden")
}

function populatePlayers(teams) {
    if (teams.left.players) {
        for (let i = 0; i < teams.left.players.length; i++) {
            populatePlayer(teams.left.players[i], i+1, teams.left.side)
        }
    }

    if (teams.right.players) {
        for (let i = 0; i < teams.right.players.length; i++) {
            populatePlayer(teams.right.players[i], i+1, teams.right.side)
        }
    }
}

function populatePlayer(player, number, side) {
    let weapons = player.getWeapons()
    let stats = player.getStats()
    let steamid = player.steamid;
    let playerNumber = 0
    switch(number) {
        case 1:
            playerNumber = 'One'
            break
        case 2:
            playerNumber = 'Two'
            break
        case 3:
            playerNumber = 'Three'
            break
        case 4:
            playerNumber = 'Four'
            break
        case 5:
            playerNumber = 'Five'
            break
        default:
            return
    }

    let $player

    if (side === "ct") {
        $player = $("#teamOne").find("#player" + playerNumber);
        side = 'left'
    } else if (side === "t") {
        $player = $("#teamTwo").find("#player" + playerNumber);
        side = 'right'
    } else {
        return
    }
    
    $player.find('.username').text(player.name)
    $player.find('.money').text("$ " + stats.money)
    $player.find('.k').find('.value').text(stats.kills)
    $player.find('.a').find('.value').text(stats.assists)
    $player.find('.d').find('.value').text(stats.deaths)

    // Alive overlay
    if (stats.health > 0) {
        $player.find('.alive').css('visibility', 'visible')
        $player.find('.dead').css('visibility', 'hidden')

        $player.find('.health').find('.value').text(stats.health)
        $player.find('.bar').css('width', stats.health + '%')

        $player.find('.kit').empty()
        if (stats.defusekit) {
            $player.find('.kit').append('<img src="/files/img/elements/kit.png"/>')
        }

        $player.find('.shield').empty()
        if (stats.armor > 0 && stats.helmet) {
            $player.find('.shield').append('<img src="/files/img/helmet.png"/>')
        } else if (stats.armor > 0) {
            $player.find('.shield').append('<img src="/files/img/armor.png"/>')
        }

        // Clear everything
        // TODO: Add taser if player has taser
        $player.find('.zeus').empty()
        $player.find('.weapon').empty()
        $player.find('.pistol').empty()
        $player.find('.utility').empty()
        
        for (let key in weapons) {
            let weapon = weapons[key]
            let weaponName = weapon.name.replace('weapon_', '')
            let state = weapon.state // TODO: Use this
            let type = weapon.type

            // Check grenade
            if (type === "Grenade") {
                for (let i = 0; i < weapon.ammo_reserve; i++) {
                    $player.find('.utility').append('<img src="/files/img/grenades/' + weapon.name + '.png"/>')
                }
                continue
            }

            // Check Pistol
            if (type === "Pistol") {
                $player.find('.pistol').append('<img src="/files/img/weapons/' + weaponName + '.png"/>')
                continue
            }

            // Check Bomb
            if (type === "C4") {
                $player.find('.kit').append('<img src="/files/img/elements/bomb.png" />')
                continue
            }

            // Check Knife
            if (type === "Knife") {
                continue
            }

            // Check primary weapon
            $player.find('.weapon').append('<img src="/files/img/weapons/' + weaponName + '.png"/>')
        }
    } else {
        // Dead overlay 
        $player.find('.alive').css('visibility', 'hidden')
        $player.find('.dead').css('visibility', 'visible')
    }

    if (!startMoney[steamid]) {
        startMoney[steamid] = stats.money
    }

    const moneySpent = startMoney[steamid] - stats.money
    
    $player.find(".money-spent").text("")
    if (moneySpent) {
        $player.find(".money-spent").text("-$" + moneySpent)
    }
}

function populateObserved(playerData) {
    let stats = playerData.getStats()
    let weapons = playerData.weapons

    $("#player-container")
        .removeClass("t ct")
        .addClass(playerData.team.toLowerCase())

    $("#observed-name").html(playerData.name)

    
    $("#nades").html("")

    for (let key in weapons) {
        let weapon = weapons[key]
        if (weapon.type == "Grenade") {
            for (let x = 0; x < weapon.ammo_reserve; x++) {
                $("#nades").append($("<img />").attr("src", "/files/img/grenades/" + weapon.name + ".png"));
            }
        }
        if (weapon.state == "active" || weapon.state == "reloading") {
            if (weapon.type == "Grenade" || weapon.type == "C4" || weapon.type == "Knife" || stats.health == 0) {
                $(".clip").html("");
                $(".reserve").html("");
            } else {
                $(".clip").html(weapon.ammo_clip + "/")
                $(".reserve").html(weapon.ammo_reserve)
            }
        }
    }
    $("#armor-text").html(stats.armor)
    $("#health-text").html(stats.health)
    $("#armor-text")
        .removeClass("armor helmet")
        .addClass(stats.helmet
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
        teams.left.players = left.players
        teams.right.players = right.players

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
        startMoney = {}
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
        $("#player-container").show()
        populateObserved(observed);
    } else {
        $("#player-container").hide()
    }

    // All players
    if (players) {
        populatePlayers(teams)
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
                if (phase.phase === "bomb" && !bombTicking) {
                    startBomb(phase.phase_ends_in)
                }
                if (phase.phase === "defuse") {
                    let defuseLength = 5 // seconds
                    if (!isDefusing) {
                        if (parseFloat(phase.phase_ends_in) > 5) {
                            defuseLength = 10
                        }
                        isDefusing = true;
                    }
                    let seconds = parseFloat(phase.phase_ends_in);
                    $("#defuse-progress").css("width", seconds / defuseLength * 353 + "px")
                }
                $("#time-counter").text("").addClass("bomb-timer")
            } else {
                stopBomb();
                $("#time-counter").text(countMinutes + ":" + countSeconds).removeClass("bomb-timer")
            }

            if (phase.phase === "defuse") {
                let defuseLength = 5 // seconds
                if (!isDefusing) {
                    if (parseFloat(phase.phase_ends_in) > 5) {
                        defuseLength = 10
                    }
                    isDefusing = true;
                }
                let seconds = parseFloat(phase.phase_ends_in);
                let widthRemaining = Math.min(seconds / defuseLength, 1.0) * 353
                $("#defuse-progress").css("width", seconds / defuseLength * 353 + "px")
            } else {
                isDefusing = false
                $("#defuse-progress").css("width", 0)
            }

            // Freezetime or timeout views
            if (phase.phase == "freezetime" || phase.phase.substring(0,7) == "timeout") {
                if (phase.phase_ends_in > 3) {
                    if ($(".kad").css("opacity") == 0) {
                        $(".kad").fadeTo(1000, 1);
                        // $("#stats-container").fadeTo(1000,1);
                        // $(".stat_t").fadeTo(1000, 1);
                        $(".series-info").css("transform","translate(0, 0px)");
                    }
                } else {
                    if ($(".kad").css("opacity") == 1) {
                        $(".kad").fadeTo(1000, 0);
                        // $(".stat_t").fadeTo(1000, 0);
                        // $("#stats-container").fadeTo(1000,0);
                        $(".series-info").css("transform","translate(0, 92px)");
                        if (observed && observed.steamid != 1) 
                            $("#player-container").fadeTo(1000, 1);
    
                        }
                    }
    
            } else {
                if ($(".kad").css("opacity") == 1) {
                    $(".kad").fadeTo(1000, 0);
                    // $(".stat_t").fadeTo(1000, 0);
                    // $("#stats-container").fadeTo(1000,0);
                    $(".series-info").css("transform","translate(0, 92px)");
                    if (observed && observed.steamid != 1) 
                        $("#player-container").fadeTo(1000, 1);
                }
            }
        }
    }

    freezeTime = round.phase == "freezetime";
    prevRound = currRound
}