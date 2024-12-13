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
                echo '</select>';
                ?>
                <label for="entries">Entries: </label>
                <input type="number" name="entries" id="entries" min="1" max="50" value="<?php echo isset($_POST["entries"]) ? $_POST["entries"] : 10; ?>">
                <button type="submit" name="leaderboard" value="leaderboard">Submit</button>
            </form>
        </div>
        <div class="table">
            <?php
            //get all users
            $dir = "stored-users";
            $userFiles = array_diff(scandir($dir), array(".",".."));
            $users = [];
            $i = 0;
            foreach($userFiles as $file){
                $f = fopen($dir."/".$file,"r");
                fgets($f);
                $users[$i]["last-login"] = fgets($f);
                fgets($f);
                $users[$i]["level"] = (int)explode("|", fgets($f))[0];
                $users[$i]["name"] = $file;

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
                        return strcmp($a["name"], $b["name"]);
                    });
                break;
            }

            echo "<table>";
            echo "<tr>";
                echo "<th>World Name</th>";
                echo "<th>Level</th>";
                echo "<th>Last Login</th>";
                echo "<th>Placed voxels</th>";
            echo "</tr>";
            
            for($i = 0; $i < min($entries, count($users)); $i++){
                echo "<tr>";
                    echo "<td>".$users[$i]["name"]."</td>";
                    echo "<td>".$users[$i]["level"]."</td>";
                    echo "<td>".$users[$i]["last-login"]."</td>";
                    echo "<td>".$users[$i]["placed"]."</td>";
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