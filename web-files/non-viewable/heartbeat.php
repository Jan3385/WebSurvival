<?php
if(!isset($_POST["heartbeat"])){
    header(http_response_code(response_code: 403));
    echo json_encode(["error"=> "Forbidden"]);
    die("Forbidden");
}

if(!isset($_POST["worldName"]) || !isset($_POST["password"])){
    header(http_response_code(response_code: 400));
    echo json_encode(["error"=> "Missing parameters"]);
    die("Missing parameters");
}

$worldName = $_POST["worldName"];
$password = $_POST["password"];


?>