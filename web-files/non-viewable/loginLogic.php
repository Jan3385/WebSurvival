<?php
$FILE_NAME = ".data";
function onRegister(){
    $FILE_NAME = $GLOBALS["FILE_NAME"];
    $token = "|||";
    $max_seed_value = 2_000_000;
    // world-name, password, email?, gamemode, seed-enable?, seed?

    $world_name = $_POST['world-name'];

    //redirect is not instant so we need to also check here for validity
    if(preg_match("/[\s\W]/", $world_name)) return;
    if(file_exists("../stored-users/".$world_name.$FILE_NAME)) return;

    $f = fopen("../stored-users/".$world_name.$FILE_NAME,"w");
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
    //mail($email, "World Created", $msg);
}

if(isset($_POST["register"])){
    onRegister();
}

$f = fopen("../stored-users/".$_POST["world-name"].$FILE_NAME,"r");

$exploded_user_data = explode("|||", fgets($f));
$password = $exploded_user_data[0];
$gamemode = $exploded_user_data[1];
$email = $exploded_user_data[2];
$seed = $exploded_user_data[3];

fgets($f); //skip last login date
$s_resources = fgets($f);

$s_playerData = fgets($f);

$s_worldData = [];
while(!feof($f)){
    array_push($s_worldData, fgets($f));
}

fclose($f);
?>