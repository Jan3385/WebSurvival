<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="interfaceStyle.css">
    <link rel="icon" href="../Icons/icon.ico" type="image/x-icon">
    <title>Login</title>
</head>
<body>
    <!-- TODO: 
        Heartbeat - zjistit zda je uživatel přihlášený
    -->
    <video autoplay muted loop id="background-video">
        <source src="../Videos/background.mp4" type="video/mp4">
    </video>
    <h1>Funny game login page</h1>
    <div class="alert" id="orange-alert"><?php
    if(session_status() == PHP_SESSION_ACTIVE && isset($_SESSION["redirect-message"])){
        $returnMessage = $_SESSION["redirect-message"];
        echo '<img src="../Icons/alert.svg" alt="!">';
        echo "<p>$returnMessage</p>";
        session_unset();
    }
    ?></div>
    <div class="alert">
        <img src="../Icons/alert.svg" alt="!"> 
        <p>Passwords stored in plain text because I am lazy (don't use any password you use somewhere else)</p>
    </div>
    <div class="container">
        <form class="form-container login" action="game.php" method="post">
            <div>
                <h3>Log into a world</h3>
                <hr>
                <label for="w-n">World name</label>
                <input type="text" name="world-name" id="w-n" placeholder="Name" required>
                <hr>
                <label for="p-l">Password for your world</label>
                <input type="password" name="password" id="p-l" placeholder="Password" required>
                <hr>
            </div>
            <button type="submit" name="login" value="login">Login</button>
        </form>
        <div class="divider"></div>
        <form class="form-container register" action="game.php" method="post">
            <div>
                <h3>Create World</h3>
                <hr>
                <label for="w-n-r">World name</label>
                <input type="text" name="world-name" id="w-n-r" placeholder="Name" required>
                <hr>
                <label for="p-r">Password for your world</label>
                <input type="password" name="password" id="p-r" placeholder="Password" required>
                <hr>
                <label for="email">Optional email</label>
                <input type="email" name="email" id="email" placeholder="*Email" autocomplete="email" title="Optional email to get automated emails about the status of your world">
                <hr>
                <div class="gamemode">
                    <div>
                        <input type="radio" name="gamemode" id="gm1" value="survival" checked required>
                        <label for="gm1">Survival</label>
                    </div>
                    <div>
                        <input type="radio" name="gamemode" id="gm2" value="peaceful" required>
                        <label for="gm2">Peaceful</label>
                    </div>
                </div>
                <hr>
                <div class="seed">
                    <h4>Use Custom Seed</h4>
                    <input type="checkbox" name="seed-enable" id="seed-enable" onclick="ChangeSeedInputStatus(this.checked)">
                    <input type="text" name="seed" id="seed" placeholder="Seed" disabled required autocomplete="off">
                </div>
            </div>
            <button type="submit" name="register" value="register">Create World</button>
        </form>
        <div class="leaderboards-button">
            <button onclick="window.location.href = 'leaderboard.php';">Leaderboards</button>
        </div>
    </div>
    <script src="../dist/login.js"></script>
</body>
</html>