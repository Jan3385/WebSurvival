<?php
$FILE_NAME = ".data";
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
    $FILE_NAME = $GLOBALS["FILE_NAME"];
    // world-name, password
    $filePath = "../stored-users/".$_POST["world-name"];

    if(!file_exists($filePath.$FILE_NAME)){
        $_SESSION["redirect-message"] = "World name does not exist";
        header("Location: login.php");
        return;
    }

    $f = fopen($filePath.$FILE_NAME,"r");

    $password = $_POST["password"];
    $world_password = explode("|||", fgets($f))[0];

    if($password != $world_password){
        $_SESSION["redirect-message"] = "Username or password is incorrect";
        header("Location: login.php");
        return;
    }

    //update last login time - usused
    //$fileContents = file("../stored-users/".$_POST["world-name"].$FILE_NAME, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    //$fileContents[1] = date("d-m-Y H:i:s");
    //file_put_contents($filePath.$FILE_NAME, implode("\n", $fileContents));
}
function onRegisterValidate(){
    $FILE_NAME = $GLOBALS["FILE_NAME"];

    if(preg_match("/[\s\W]/", $FILE_NAME)){
        $_SESSION["redirect-message"] = "World name cannot contain spaces or special characters '$FILE_NAME'";
        header("Location: login.php");
        return;
    }

    //check if user already exists
    if(file_exists("../stored-users/".$_POST["world-name"].$FILE_NAME)){
        $_SESSION["redirect-message"] = "World name already exists";
        header("Location: login.php");
        return;
    }
}
?>