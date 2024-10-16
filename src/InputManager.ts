/// <reference path="SupportClasses.ts" />

let MovementVector: Vector2 = new Vector2(0, 0);

let usedInput: boolean = false;
let inputPresses: string[] = [];
let removeInputValues: string[] = [];

//calls repeatedly on key hold
function onKeyDown(event: KeyboardEvent){
    switch(event.code){
        case "KeyW": //W
            if(MovementVector.y != -1){
                MovementVector.y = -1;
                usedInput = false;
         }
            break;
        case "KeyA": //A
            if(MovementVector.x != -1){
                MovementVector.x = -1;
                usedInput = false;
            }
            break;
        case "KeyS": //S
            if(MovementVector.y != 1){
                MovementVector.y = 1;
                usedInput = false;
            }
            break;
        case "KeyD": //D
            if(MovementVector.x != 1){
                MovementVector.x = 1;
                usedInput = false;
            }
            break;
        default:
            //for other keys add to input presses array
            if(!inputPresses.includes(event.code)){
                inputPresses.push(event.code);
                usedInput = false;
            }
            break;
    }

    CheckInputPos();
}
let clearMap =  {xMinus: false, xPlus: false, yMinus: false, yPlus: false};
//calls once on key release
function onKeyUp(event: KeyboardEvent){
    //clear movement vector if it was registered ingame
    if(usedInput){
        switch(event.code){
            case "KeyW":
                if(MovementVector.y == -1) MovementVector.y = 0;
                break;
            case "KeyD":
                if(MovementVector.x == 1) MovementVector.x = 0;
                break;
            case "KeyS":
                if(MovementVector.y == 1) MovementVector.y = 0;
                break;
            case "KeyA":
                if(MovementVector.x == -1) MovementVector.x = 0;
                break;
            default:
                if(inputPresses.includes(event.code)) inputPresses.splice(inputPresses.indexOf(event.code), 1);
                break;
        }
        return;
    }

    //if the key was not registered ingame, designate for later removal
    switch(event.code){
        case "KeyW":
            clearMap.yMinus = true;
            break;
        case "KeyD":
            clearMap.xPlus = true;
            break;
        case "KeyS":
            clearMap.yPlus = true;
            break;
        case "KeyA":
            clearMap.xMinus = true;
            break;
    }

    removeInputValues.push(event.code);
}
//inputs have been used and can be cleared now
function UpdateInput(){
    usedInput = true;
    //clears any movement vector if its designated for clearing
    if(clearMap.xMinus) {
        if(MovementVector.x == -1) MovementVector.x = 0;
        clearMap.xMinus = false;
    }
    if(clearMap.xPlus) {
        if(MovementVector.x == 1) MovementVector.x = 0;
        clearMap.xPlus = false;
    }
    if(clearMap.yMinus) {
        if(MovementVector.y == -1) MovementVector.y = 0;
        clearMap.yMinus = false;
    }
    if(clearMap.yPlus) {
        if(MovementVector.y == 1) MovementVector.y = 0;
        clearMap.yPlus = false;
    }

    //removes any keys that were designated for removal
    if(removeInputValues.length > 0){
        removeInputValues.forEach(value => {
            if(inputPresses.includes(value)) inputPresses.splice(inputPresses.indexOf(value), 1);
        });
        removeInputValues = [];
    } 

    CheckInputPos();
}
function CheckInputPos(){
    //check if player is trying to move out of bounds
    if(Player.x + MovementVector.x < 0 || Player.x + MovementVector.x >= Terrain.ins.MapX())
        MovementVector.x = 0;
    if(Player.y + MovementVector.y < 0 || Player.y + MovementVector.y >= Terrain.ins.MapY())
        MovementVector.y = 0;
}

window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);