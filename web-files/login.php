<?php session_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="loginStyle.css">
    <link rel="icon" href="../Icons/icon.ico" type="image/x-icon">
    <title>Document</title>
</head>
<body>
    <!-- TODO: 
        Leaderboard - výběrový seznam
        Register / Login <- datum vytvoření / poslední přihlášení
        Game Load / Save
    -->
    <video autoplay muted loop id="background-video">
        <source src="../Videos/background.mp4" type="video/mp4">
    </video>
    <h1>Funny game login page</h1>
    <div class="container">
        <?php
        if(session_status() == PHP_SESSION_ACTIVE && isset($_SESSION["redirect-message"])){
            $returnMessage = $_SESSION["redirect-message"];
            echo "<p>! $returnMessage !</p>";
            session_unset();
        }
        ?>
        <p>! Passwords stored in plain text because I am lazy (don't use any password you used somewhere else) !</p>
        <div class="form-container login">
            <h3>Login</h3>
            <form id="login-form" action="game.php" method="post">
                <hr>
                <input type="text" name="world-name" id="w-n" placeholder="Name" required>
                <label for="w-n">World name</label>
                <hr>
                <input type="password" name="password" id="p-l" placeholder="Password" required>
                <label for="p-l">Password for your world</label>
                <hr>
                <button type="submit" name="login" value="login">Login</button>
            </form>
        </div>
        <div class="form-container register">
            <h3>Register</h3>
            <form id="register-form" action="game.php" method="post">
                <hr>
                <input type="text" name="world-name" id="w-n-r" placeholder="Name" required>
                <label for="w-n-r">World name</label>
                <hr>
                <input type="password" name="password" id="p-r" placeholder="Password" required>
                <label for="p-r">Password for your world</label>
                <hr>
                <input type="email" name="email" id="email" placeholder="*Email" autocomplete="email" title="Optional email to get automated emails about the status of your world">
                <label for="email">Optional email</label>
                <hr>
                <div class="gamemode">
                    <input type="radio" name="gamemode" id="gm1" value="survival" checked required>
                    <label for="gm1">Survival</label>
                </div>
                <div class="gamemode">
                    <input type="radio" name="gamemode" id="gm2" value="peacefull" required>
                    <label for="gm2">Peacefull</label>
                </div>
                <hr>
                <div class="seed">
                    <h4>Use Custom Seed</h4>
                    <input type="checkbox" name="seed-enable" id="seed-enable" onclick="ChangeSeedInputStatus(this.checked)">
                    <input type="text" name="seed" id="seed" placeholder="Seed" disabled required autocomplete="off">
                </div>
                <hr>
                <button type="submit" name="register" value="register">Register</button>
            </form>
        </div>
        <div class="leaderboards-button">
            <button>Leaderboards</button>
        </div>
    </div>
    <script src="../dist/login.js"></script>
</body>
</html>