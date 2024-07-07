window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

class Vector2{
    x: number;
    y: number;
    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}

let MovementVector: Vector2 = new Vector2(0, 0);

let usedInput: boolean = false;
let inputPresses: number[] = [];
let removeInputValues: number[] = [];

//calls repeatedly on key hold
function onKeyDown(event: KeyboardEvent){
    switch(event.keyCode){
        case 87: //W
            if(MovementVector.y != -1){
                MovementVector.y = -1;
                usedInput = false;
         }
            break;
        case 65: //A
            if(MovementVector.x != -1){
                MovementVector.x = -1;
                usedInput = false;
            }
            break;
        case 83: //S
            if(MovementVector.y != 1){
                MovementVector.y = 1;
                usedInput = false;
            }
            break;
        case 68: //D
            if(MovementVector.x != 1){
                MovementVector.x = 1;
                usedInput = false;
            }
            break;
        default:
            //for other keys add to input presses array
            if(!inputPresses.includes(event.keyCode)){
                inputPresses.push(event.keyCode);
                usedInput = false;
            }
            break;
    }
    //if(event.keyCode >= 49 && event.keyCode <= 57) SelectBuilding(event.keyCode - 49);
}
let clearMap =  {xMinus: false, xPlus: false, yMinus: false, yPlus: false};
//calls once on key release
function onKeyUp(event: KeyboardEvent){
    //clear movement vector if it was registered ingame
    if(usedInput){
        switch(event.keyCode){
            case 87:
                if(MovementVector.y == -1) MovementVector.y = 0;
                break;
            case 68:
                if(MovementVector.x == 1) MovementVector.x = 0;
                break;
            case 83:
                if(MovementVector.y == 1) MovementVector.y = 0;
                break;
            case 65:
                if(MovementVector.x == -1) MovementVector.x = 0;
                break;
            default:
                if(inputPresses.includes(event.keyCode)) inputPresses.splice(inputPresses.indexOf(event.keyCode), 1);
                break;
        }
        return;
    }

    //if the key was not registered ingame, designate for later removal
    switch(event.keyCode){
        case 87:
            clearMap.yMinus = true;
            break;
        case 68:
            clearMap.xPlus = true;
            break;
        case 83:
            clearMap.yPlus = true;
            break;
        case 65:
            clearMap.xMinus = true;
            break;
    }

    removeInputValues.push(event.keyCode);
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
}