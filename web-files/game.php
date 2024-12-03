<?php include "validateLogin.php" ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="gameStyle.css">
    <link rel="icon" href="../Icons/icon.ico" type="image/x-icon">
    <title>Game</title>
</head>
<body>

    <div class="Mobile-Warning" id="Mobile-Blocker">
        <h5>This is not a mobile experience</h5>
        <p>This game is unplayable without a keyboard</p>
    </div>
    <div class="container">
        <ul class="Main-List" id="GamePanel">
            <li class="Game-Spacer">
                <h4 class="GameDay" id="Game-Day">Day 1</h4>
                <div class="Xp-Bar">
                    <p id="Player-Level">Level: 30</p>
                    <div class="divider"></div>
                    <p id="Player-XPLevel">108/432xp</p>
                </div>
                <div class="Tutorial-Panel">
                    <p id="world-name">Word name: </p>
                    <p id="seed">seed: </p>
                    <div class="save-panel">
                        <button onclick="Save()">Save</button>
                        <button onclick="SaveExitGame()">Save & Exit</button>
                    </div>
                    <div class="Quest">
                        <h3>Active Quest</h3>
                        <div>
                            <p id="Quest-XP">1xp</p>
                            <p id="Quest-Description">Survive the night</p>
                            <p id="Quest-Completion">1/1</p>
                        </div>
                    </div>

                    <h4>-Controls-</h4>
                    <table class="tutorial">
                        <tr>
                            <td class="key">[WASD]</td>
                            <td>Movement</td>
                        </tr>
                        <tr>
                            <td class="key">[E]</td>
                            <td>Build below player</td>
                        </tr>
                        <tr>
                            <td class="key">[Q]</td>
                            <td>Break/Mine below player</td>
                        </tr>
                        <tr>
                            <td class="key">[Mouse]</td>
                            <td>Select buildings and eat</td>
                        </tr>
                    </table>
                </div>
            </li>
            <li class="Game-Spacer Canvas-Game-Spacer">
                <canvas id="gameCanvas" width="720" height="480"></canvas>
            </li>
            <li class="Game-Spacer">
                <div class="Info-Bar">
                    <p id="Health">HP: 10</p>
                    <div class="divider"></div>
                    <p id="Time">22:00</p>
                </div>
                <div class="Player-Material-List" id="Player-Resources">
                    <p>- Crafting -</p>
                    <div class="Crafting-List">
                        <hr>
                    </div>
                    <p>- Resources -</p>
                    <div class="Player-Resources-List" id="resources">
                        <hr>
                    </div>
                </div>
            </li>
        </ul>
        <div class="Selection-Button-Div">
            <ul>
                <li>
                    <p id="Selected-Building-Label" class="Tooltip-Building"></p>
                </li>
                <li class="Cost-List">
                    <p class="Cost-Build">Cost:</p>
                    <p id="C-Wood"><img src="../Icons/wood.png">: 20</p>
                    <p id="C-Stone"><img src="../Icons/stone.png">: 20</p>
                </li>
                <li class="Material-Building-List">
                    <select id="Material-Select" onchange="UpdateSelectedBuilding();" onkeydown="false">
                        <option value="0">cheap wood</option>
                        <option value="1">wood</option>
                        <option value="2">stone</option>
                    </select>
                    <button onclick="SelectBuilding(0)" id="Selected">Wall</button>
                    <button onclick="SelectBuilding(1)" id="Unselected">Floor</button>
                    <button onclick="SelectBuilding(2)" id="Unselected">Door</button>
                </li>
                <li class="Non-Material-Building-List">
                    <button onclick="SelectBuilding(3)" id="Unselected">Torch</button>
                    <button onclick="SelectBuilding(4)" id="Unselected">Lantern</button>
                    <button onclick="SelectBuilding(5)" id="Unselected">Landfill</button>
                    <button onclick="SelectBuilding(6)" id="Unselected">Glass</button>
                    <button onclick="SelectBuilding(7)" id="Unselected">Furnace</button>
                    <button onclick="SelectBuilding(8)" id="Unselected">Large Furnace</button>
                </li>
            </ul>
        </div>
    </div>
    <?php include "loginLogic.php" ?>
    <script>
        console.log("Game loaded"); 
        // Load game variables from PHP
        let seed = <?php echo $GLOBALS['seed']; ?>;
        let worldName = "<?php echo $_POST['world-name']; ?>";
        let password = "<?php echo $_POST['password']; ?>";
        let gamemode = "<?php echo $GLOBALS['gamemode']; ?>";

        let resourceSave = <?php echo json_encode($GLOBALS['s_resources']); ?>;

        let playerData = <?php echo json_encode($GLOBALS['s_playerData']); ?>;

        document.getElementById("world-name").innerHTML = "World name: " + worldName;
        document.getElementById("seed").innerHTML = "seed: " + seed;
    </script>
    <script src="../dist/game.js"></script>
</body>
</html>