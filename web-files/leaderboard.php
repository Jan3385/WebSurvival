<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="interfaceStyle.css">
    <link rel="icon" href="../Icons/icon.ico" type="image/x-icon">
    <title>Leaderboard</title>
</head>
<body>
    <video autoplay muted loop id="background-video">
        <source src="../Videos/background.mp4" type="video/mp4">
    </video>
    <h1>Leaderboard</h1>
    <div class="leaderboard-container">
        <div class="header">
            <form action="" method="post">
                <label for="sort">Sort By: </label>
                <?php
                $sort = isset($_POST["sort"]) ? $_POST["sort"] : "level";
                echo '<select name="sort" id="sort">';
                echo '<option value="level" '.($sort == "level" ? "selected" : "").'>Highest level</option>';
                echo '<option value="active" '.($sort == "active" ? "selected" : "").'>Last active</option>';
                echo '<option value="placed" '.($sort == "placed" ? "selected" : "").'>Placed voxels</option>';
                echo '<option value="alphabet" '.($sort == "alphabet" ? "selected" : "").'>Alphabetically</option>';
                echo '<option value="days" '.($sort == "days" ? "selected" : "").'>Days played</option>';
                echo '</select>';
                ?>
                <label for="min-level">min. level: </label>
                <input type="number" name="min-level" id="min-level" min="0" max="50" value="<?php echo isset($_POST["min-level"]) ? $_POST["min-level"] : 0; ?>">
                <label for="entries">Entries: </label>
                <input type="number" name="entries" id="entries" min="1" max="50" value="<?php echo isset($_POST["entries"]) ? $_POST["entries"] : 10; ?>">
                <button type="submit" name="leaderboard" value="leaderboard">Submit</button>
            </form>
        </div>
        <div class="table">
            <?php
            //get all users
            $dir = "../stored-users";
            $userFiles = array_diff(scandir($dir), array(".",".."));
            $min_level = isset($_POST["min-level"]) ? $_POST["min-level"] : 0;
            $users = [];
            $i = 0;
            foreach($userFiles as $file){
                $f = fopen($dir."/".$file,"r");
                $users[$i]["gamemode"] = explode("|||", fgets($f))[1];
                $users[$i]["last-login"] = fgets($f);
                fgets($f);
                $user_data = explode("|", fgets($f));
                $users[$i]["level"] = (int)($user_data[0]);

                //skip any user that does not meet the level requirement
                if($users[$i]["level"] < $min_level){
                    fclose($f);
                    continue;
                }

                $users[$i]["days"] = (int)($user_data[9]);
                $users[$i]["name"] = explode(".", $file)[0];

                //read the number of placed voxels (excluding resources)
                $placed = 0;
                while(!feof($f)){
                    $line = fgets($f);
                    if($line == "") continue;
                    $voxel = explode("|", $line)[1];
                    if($voxel != "l" && $voxel != "w" && $voxel != "s" && $voxel != "i"){
                        $placed++;
                    }
                }
                $users[$i]["placed"] = $placed;

                $i++;
            }
            fclose($f);

            //sort users
            $entries = isset($_POST["entries"]) ? $_POST["entries"] : 10;
            
            switch($sort){
                case "level":
                    usort($users, function($a, $b){
                        return $b["level"] - $a["level"];
                    });
                break;
                case "active":
                    usort($users, function($a, $b){
                        return strtotime($b["last-login"]) - strtotime($a["last-login"]);
                    });
                break;
                case "placed":
                    usort($users, function($a, $b){
                        return $b["placed"] - $a["placed"];
                    });
                break;
                case "alphabet":
                    usort($users, function($a, $b){
                        return strcmp($b["name"], $a["name"]);
                    });
                case "days":
                    usort($users, function($a, $b){
                        return $b["days"] - $a["days"];
                    });
                break;
            }

            //display users
            echo "<table>";
            echo "<tr>";
                echo "<th>World Name</th>";
                echo "<th>Level</th>";
                echo "<th>Days</th>";
                echo "<th>Last Login</th>";
                echo "<th>Placed voxels</th>";
                echo "<th>Gamemode</th>";
            echo "</tr>";

            $defaultTimeZone = new DateTimeZone(date_default_timezone_get());
            $userTimeZone = new DateTimeZone("Europe/Prague"); //není uplně 💯 ale jinak to dělat nebudu
            
            for($i = 0; $i < min($entries, count($users)); $i++){
                echo "<tr>";
                    echo "<td>".$users[$i]["name"]."</td>";
                    echo "<td>".$users[$i]["level"]."</td>";
                    echo "<td>".$users[$i]["days"]."</td>";
                    $time = new DateTime($users[$i]["last-login"], $defaultTimeZone);
                    $time->setTimezone($userTimeZone);
                    echo "<td>".$time->format("d. m. Y | H:i:s")."</td>";
                    echo "<td>".$users[$i]["placed"]."</td>";
                    echo "<td>".$users[$i]["gamemode"]."</td>";
                echo "</tr>";
            }

            echo "</table>";
            ?>
        </div>
        <div class="footer">
            <button onclick="window.location.href = 'login.php';">Back</button>
        </div>
    </div>
</body>
</html>