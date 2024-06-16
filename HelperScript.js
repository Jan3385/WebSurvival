// -- Input Manager --
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

let MovementVector = {x:0,y:0};

let usedInput = false;
let inputPresses = [];
let removeInputValues = [];

//calls repeatedly on key hold
function onKeyDown(event){
    //for movement keys update movement vector
    switch(event.keyCode){
        case 87:
            if(MovementVector.y != -1){
                MovementVector.y = -1;
                usedInput = false;
            }
            break;
        case 68:
            if(MovementVector.x != 1){
                MovementVector.x = 1;
                usedInput = false;
            }
            break;
        case 83:
            if(MovementVector.y != 1){
                MovementVector.y = 1;
                usedInput = false;
            }
            break;
        case 65:
            if(MovementVector.x != -1){
                MovementVector.x = -1;
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
    //building selection
    if(event.keyCode >= 49 && event.keyCode <= 57) SelectBuilding(event.keyCode - 49);
}
let clearMap = {xMinus: false, xPlus: false, yMinus: false, yPlus: false};
//calls only once when key is released
function onKeyUp(event){
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
    if(removeInputValues != []){
        removeInputValues.forEach(value => {
            if(inputPresses.includes(value)) inputPresses.splice(inputPresses.indexOf(value), 1);
        });
        removeInputValues = [];
    } 
}

// -- Perlin Noise Generator --
function RandomUsingSeed(seed) {
    var m = 0x80000000; // 2**31
    var a = 1103515245;
    var c = 12345;

    var state = seed;

    return function() {
        state = (a * state + c) % m;
        return state / (m - 1);
    };
}

class PerlinNoise {
    constructor(seed) {
        this.rnd = RandomUsingSeed(seed);
        this.permutation = this.generatePermutation();
        this.gradients = this.generateGradients();
    }

    generatePermutation() {
        let permutation = [];
        for (let i = 0; i < 256; i++) {
            permutation.push(i);
        }
        permutation.sort(() => this.rnd() - 0.5);
        return permutation.concat(permutation);
    }

    generateGradients() {
        const gradients = [];
        for (let i = 0; i < 256; i++) {
            const theta = this.rnd() * 2 * Math.PI;
            gradients.push({ x: Math.cos(theta), y: Math.sin(theta) });
        }
        return gradients;
    }

    dotGridGradient(ix, iy, x, y) {
        const gradient = this.gradients[(this.permutation[ix + this.permutation[iy & 255]] & 255)];
        const dx = x - ix;
        const dy = y - iy;
        return dx * gradient.x + dy * gradient.y;
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    //returns value between 0 and 1
    perlin(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const n00 = this.dotGridGradient(X, Y, x, y);
        const n01 = this.dotGridGradient(X, Y + 1, x, y);
        const n10 = this.dotGridGradient(X + 1, Y, x, y);
        const n11 = this.dotGridGradient(X + 1, Y + 1, x, y);

        const x1 = this.lerp(n00, n10, u);
        const x2 = this.lerp(n01, n11, u);

        return (this.lerp(x1, x2, v)+1)/2;
    }

    perlinColorTerrain(x, y) {
        const value = this.perlin(x, y);
        //ocean
        if(value > 0.7) return {
            r: value*10,
            g: value*10,
            b: value*400,
            s: PixelStatus.block
        }
        //sand
        if(value > 0.62) return {
            r: value*255 + 30,
            g: value * 255 + 30,
            b: value*10,
            s: PixelStatus.free
        }
        //hills or rock (probably delete later)
        //if(value < 0.25) return `rgb(${255 - value * 170}, ${255 - value * 170}, ${255 - value * 170})`;
        //grass
        return {
            r: value*50,
            g: 240 - value*90,
            b: value*50,
            s: PixelStatus.free
        };
    }
    pixel(x,y){
        return PixelData(this.perlinColorTerrain(x,y));
    }
}
let Perlin = new PerlinNoise(Math.random() * 1000); //TODO add custom seed
// --- building ---
let buildButtons = document.getElementsByClassName("Selection-Button-Div")[0].querySelectorAll("button");
const BuildType = {
    Wall: 0,
    Floor: 1,
}
let Building = [
    CheapWall = {
        build: new BuildingData(new rgb(244, 211, 94), 1, 1, PixelStatus.block, 3, _Highlight.border, InteractType.wall),
        cost: {stone: 0, wood: 3}
    },
    WoodenWall = {
        build: new BuildingData(new rgb(127, 79, 36), 1, 1, PixelStatus.block, 12, _Highlight.border, InteractType.wall),
        cost: {stone: 0, wood: 10}
    },
    StoneWall = {
        build: new BuildingData(new rgb(85, 85, 85), 1, 1, PixelStatus.block, 24, _Highlight.border, InteractType.wall),
        cost: {stone: 15, wood: 2}
    },
    CheapFloor = {
        build: new BuildingData(new rgb(255, 243, 176), 1, 1, PixelStatus.taken, 1, _Highlight.none, InteractType.floor),
        cost: {stone: 0, wood: 1}
    },
    WoodenFloor = {
        build: new BuildingData(new rgb(175, 164, 126), 1, 1, PixelStatus.taken, 3, _Highlight.none, InteractType.floor),
        cost: {stone: 0, wood: 2}
    },
    StoneFloor = {
        build: new BuildingData(new rgb(206, 212, 218), 1, 1, PixelStatus.taken, 6, _Highlight.none, InteractType.floor),
        cost: {stone: 2, wood: 0}
    },
    cheapDoor = {
        build: new DoorData(new rgb(255, 231, 230), 1, 1, PixelStatus.block, 3, _Highlight.slash, InteractType.door),
        cost: {stone: 0, wood: 10}
    },
    woodenDoor = {
        build: new DoorData(new rgb(200, 180, 166), 1, 1, PixelStatus.block, 12, _Highlight.slash, InteractType.door),
        cost: {stone: 0, wood: 20}
    },
    stoneDoor = {
        build: new DoorData(new rgb(200, 200, 200), 1, 1, PixelStatus.block, 24, _Highlight.slash, InteractType.door),
        cost: {stone: 25, wood: 2}
    }
];

let SelectedBuilding = Building[0];
let buildId = 0;
function SelectBuilding(id){
    buildButtons.forEach(button => button.id = "Unselected");
    buildButtons[id].id = "Selected";

    buildId = id;
    UpdateSelectedBuilding();
}
function cheat(){
    Resources.stone += 1000;
    Resources.wood += 1000;
    Render.UpdateResourcesScreen();
}
/**
 * Returns the id of the selected material
 * @returns {number}
 */
function GetSelectedMaterialId(){
    const option = document.getElementById("Material-Select").value;

    return Number.parseInt(option);
}
function UpdateSelectedBuilding(){
    let id = buildId;
    if(buildId <= 2){
        const materialId = GetSelectedMaterialId();
        id = buildId * 3 + materialId;
    }
    SelectedBuilding = Building[id];
}