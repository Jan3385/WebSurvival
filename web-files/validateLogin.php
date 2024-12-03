<?php
session_start();
if(isset($_POST["login"])) 
    onLoginValidate();
else if(isset($_POST["register"])){
    onRegisterValidate();
}else{
    $_SESSION["redirect-message"] = "Login session expired";
    header("Location: login.php");
    return;
}
function onLoginValidate(){
    // world-name, password
    $filePath = "../stored-users/".$_POST["world-name"];

    if(!file_exists($filePath)){
        $_SESSION["redirect-message"] = "World name does not exist";
        header("Location: login.php");
        return;
    }

    $f = fopen($filePath,"r");

    $password = $_POST["password"];
    $world_password = strtok(fgets($f),"|||");

    if($password != $world_password){
        $_SESSION["redirect-message"] = "Username or password is incorrect";
        header("Location: login.php");
        return;
    }

    //update last login time
    $fileContents = file("../stored-users/".$_POST["world-name"], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $fileContents[1] = date("d-m-Y H:i:s");
    file_put_contents($filePath, implode("\n", $fileContents));
}
function onRegisterValidate(){
    //check if user already exists
    if(file_exists("../stored-users/".$_POST["world-name"])){
        $_SESSION["redirect-message"] = "World name already exists";
        header("Location: login.php");
        return;
    }
}
?>