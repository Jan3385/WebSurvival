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
                <select name="sort" id="sort">
                    <option value="level">Highest level</option>
                    <option value="active">Last active</option>
                    <option value="placed">Placed voxels</option>
                    <option value="alphabet">Alphabetically</option>
                </select>
                <label for="entries">Entries: </label>
                <input type="number" name="entries" id="entries" min="1" max="25" value="10">
                <button type="submit" name="leaderboard" value="leaderboard">Submit</button>
            </form>
        </div>
        <div class="table">
            <?php
            if(isset($_POST["leaderboard"])){
                //get all users
                $dir = "../stored-users";
                $userFiles = array_diff(scandir($dir), array(".",".."));
                $users = [];
                $i = 0;
                foreach($userFiles as $file){
                    $f = fopen($dir.$file,"r");
                    fgets($f);
                    $users[$i]["last-login"] = fgets($f);
                    fgets($f);
                    $$users[$i]["level"] = explode("|", fgets($f))[0];
                    $users[$i]["name"] = $file;
                    $i++;
                }
                fclose($f);

                //sort users
                $sort = $_POST["sort"];
                if(isset($_POST["entries"])) $entries = $_POST["entries"];
                else $entries = 10;
                
                switch($sort){
                    case "level":
                        usort($users, function($a, $b){
                            return $a["level"] - $b["level"];
                        });
                    break;
                    case "active":
                        usort($users, function($a, $b){
                            return strtotime($a["last-login"]) - strtotime($b["last-login"]);
                        });
                    break;
                    case "placed":
                        usort($users, function($a, $b){
                            return $a["placed"] - $b["placed"];
                        });
                    break;
                    case "alphabet":
                        usort($users, function($a, $b){
                            return strcmp($a["name"], $b["name"]);
                        });
                    break;
                }

                echo "<table>";

                echo "</table>";
            }
            ?>
            <table>
                <tr>
                    <th>World Name</th>
                    <th>Level</th>
                    <th>Last Login</th>
                    <th>Placed voxels</th>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
                <tr>
                    <td>A</td>
                    <td>B</td>
                    <td>C</td>
                    <td>D</td>
                </tr>
            </table>
        </div>
        <div class="footer">
            <button onclick="window.location.href = 'login.php';">Back</button>
        </div>
    </div>
</body>
</html>