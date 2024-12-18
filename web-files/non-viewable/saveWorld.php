<?php
$FILE_NAME = ".data";
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if( !isset($data["worldName"]) ||
    !isset($data["password"])  ||
    !isset($data["resources"]) ||
    !isset($data["playerData"])||
    !isset($data["worldData"])){
    header(http_response_code(response_code: 400));
    echo json_encode(["error"=> "Missing parameters"]);
    die("Missing parameters");
}

$worldName = $data["worldName"];
$password = $data["password"];
$resources = $data["resources"];
$playerData = $data["playerData"];
$worldData = $data["worldData"];

$filePath = "../../stored-users/".$worldName;

if (!file_exists($filePath.$FILE_NAME)) {
    header(http_response_code(response_code: 401));
    echo json_encode(["error"=> "World not found"]);
    die("World name does not exist");
}

$f = fopen($filePath.$FILE_NAME, "r");
$static_text = fgets($f);
$prev_modification_date_string = fgets($f);
$prev_modification_date_string = str_replace("\n", '', $prev_modification_date_string);
fclose($f);

//$current_date = date_create("now");
//$prev_modification_date = date_create_from_format("d-m-Y H:i:s", $prev_modification_date_string);
//$interval = $current_date->getTimestamp() - $prev_modification_date->getTimestamp();

// use if this becomes an issue
//if($interval <= 3){
//    header(http_response_code(response_code: 403));
//    echo json_encode(["error"=> "Too many requests"]);
//    die("Wait a few seconds before saving again");
//}


$world_password = explode("|||",$static_text)[0];

if ($password != $world_password) {
    header(http_response_code(response_code: 401));
    echo json_encode(["error"=> "Unauthorized"]);
    die("Username or password is incorrect");
}

$f = fopen($filePath.$FILE_NAME, "w");
fputs($f, $static_text);
fputs($f,date("d-m-Y H:i:s"));
fputs($f, "\n".$resources);
fputs($f,  $playerData);
foreach ($worldData as $voxelInfo){
    fputs($f, $voxelInfo);
    fputs($f, "\n");
}

fclose($f);
?>