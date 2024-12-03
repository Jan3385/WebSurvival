<?php
function onRegister(){
    $token = "|||";
    $max_seed_value = 2_000_000;
    // world-name, password, email?, gamemode, seed-enable?, seed?

    $world_name = $_POST['world-name'];

    $f = fopen("../stored-users/".$world_name,"w");
    fwrite($f,$_POST["password"].$token);
    fwrite($f,$_POST["gamemode"].$token);

    $email = $_POST["email"] == "" ? "none" : $_POST["email"];
    fwrite($f,$email.$token);

    $seed = 0;
    if(isset($_POST["seed-enable"])){
        if(is_numeric($_POST["seed"]) && (float)$_POST["seed"] > 0 && (float)$_POST["seed"] < $max_seed_value){
            $seed = (float)$_POST["seed"];
        }else
            $seed = abs(crc32($_POST["seed"])) % $max_seed_value;
    }
    else $seed = rand(0, $max_seed_value);
    fwrite($f,$seed.$token);

    fwrite($f,date("d-m-Y H:i:s").$token);
    fwrite($f,data: "\n".date("d-m-Y H:i:s"));

    fclose($f);

    if($email == "none") return;
    $msg = "World $world_name created successfully!\n";
}

if(isset($_POST["register"])){
    onRegister();
}

$f = fopen("../stored-users/".$_POST["world-name"],"r");

$password = strtok(fgets($f),"|||");
$gamemode = strtok("|||");
$email = strtok("|||");
$seed = strtok("|||");

fgets($f); //skip last login date
$s_resources = fgets($f);

$s_playerData = fgets($f);

fclose($f);
?>