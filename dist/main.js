"use strict";
class rgb {
    /**
     * @constructor
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    r;
    g;
    b;
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    new() {
        return new rgb(this.r, this.g, this.b);
    }
    newSlightlyRandom(val) {
        return new rgb(this.r + Math.floor(Math.random() * val), this.g + Math.floor(Math.random() * val), this.b + Math.floor(Math.random() * val));
    }
    changeBy(val) {
        return new rgb(this.r + val, this.g + val, this.b + val);
    }
    /**
    * Returns the rgb value in string format
    * @returns {string}
    */
    get() {
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
    }
    getWithLight(light) {
        let lightShift = Math.min(light / 5, 1.1);
        return 'rgb(' + Math.floor(this.r * lightShift) + ',' + Math.floor(this.g * lightShift) + ',' + Math.floor(this.b * lightShift) + ')';
    }
    /**
     * Makes the rgb value darker by the value
     * @param {number} val
     */
    Darken(val = 1.5) {
        this.r /= val;
        this.g /= val;
        this.b /= val;
    }
}
var PixelStatus;
(function (PixelStatus) {
    PixelStatus[PixelStatus["free"] = 0] = "free";
    PixelStatus[PixelStatus["taken"] = 1] = "taken";
    PixelStatus[PixelStatus["block"] = 2] = "block";
    PixelStatus[PixelStatus["interact"] = 3] = "interact";
})(PixelStatus || (PixelStatus = {}));
;
var _Highlight;
(function (_Highlight) {
    _Highlight[_Highlight["none"] = 0] = "none";
    _Highlight[_Highlight["lightBorder"] = 1] = "lightBorder";
    _Highlight[_Highlight["border"] = 2] = "border";
    _Highlight[_Highlight["thickBorder"] = 3] = "thickBorder";
    _Highlight[_Highlight["slash"] = 4] = "slash";
})(_Highlight || (_Highlight = {}));
class PixelData {
    /**
     * Stores data about the given pixel
     * @param {number} color
     * @param {PixelStatus} status
     */
    color;
    status;
    Brightness = 0;
    constructor(color, status = PixelStatus.free) {
        this.color = color;
        this.status = status;
    }
}
/**
 * Given a X and Y position returns a predictable pixel using perlin noise
 * @param {number} x
 * @param {number} y
 * @returns {PixelData}
 */
function PerlinPixel(x, y) {
    const pColor = Perlin.perlinColorTerrain(x / 9, y / 9);
    return new PixelData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s);
}
const EmptyPixel = new PixelData(new rgb(147, 200, 0));
class PlayerData extends PixelData {
    /**
     * Creates a player object with the given colors at the given position
     * @param {rgb} color
     * @param {rgb} borderColor
     * @param {number} x
     * @param {number} y
     */
    borderColor;
    x;
    y;
    OverlapPixel;
    constructor(color, borderColor, x, y) {
        super(color, PixelStatus.block);
        this.borderColor = borderColor;
        this.x = x;
        this.y = y;
        this.OverlapPixel = PerlinPixel(x, y);
    }
}
var InteractType;
(function (InteractType) {
    InteractType[InteractType["stone"] = 0] = "stone";
    InteractType[InteractType["wood"] = 1] = "wood";
    InteractType[InteractType["door"] = 2] = "door";
    InteractType[InteractType["wall"] = 3] = "wall";
    InteractType[InteractType["floor"] = 4] = "floor";
    InteractType[InteractType["light"] = 5] = "light";
})(InteractType || (InteractType = {}));
;
class InteractData extends PixelData {
    /**
     * Construct a interactable pixel with the given color at the given position
     * @param {rgb} color
     * @param {number} x
     * @param {number} y
     * @param {InteractType} type
     * @param {number} [hp=6]
     */
    x;
    y;
    interactType;
    health;
    highlight;
    constructor(color, x, y, type, hp = 6, highlight = _Highlight.border) {
        super(color, PixelStatus.interact);
        this.x = x;
        this.y = y;
        this.interactType = type;
        this.health = hp;
        this.highlight = highlight;
    }
    /**
     * Damages the interactable pixel, return true if it was destroyed (on final hit)
     * @returns {boolean}
     */
    Damage() {
        this.health--;
        this.color.Darken(1.2);
        if (this.health <= 0) {
            Terrain.DeleteResourcePixel(this.x, this.y);
            return true;
        }
        return false;
    }
}
class BuildingData extends InteractData {
    /**
     * @constructor
     * @param {rgb} color
     * @param {number} x
     * @param {number} y
     * @param {PixelStatus} walkStatus
     * @param {number} hp
     * @param {_Highlight} highlight
     * @param {InteractType} interactionType
     */
    name;
    walkStatus;
    maxHealh;
    defaultColor;
    highlight;
    constructor(name, color, x, y, walkStatus, hp = 12, highlight = _Highlight.border, interactionType) {
        super(color, x, y, interactionType, hp);
        this.name = name;
        this.maxHealh = hp;
        this.defaultColor = color.new();
        this.walkStatus = walkStatus;
        this.highlight = highlight;
    }
    /**
     * Returns this object at the specified coordinates
     * @param {number} x
     * @param {number} y
     * @returns {ThisType}
     */
    at(x, y) {
        return new BuildingData(this.name, this.defaultColor.newSlightlyRandom(30), x, y, this.walkStatus, this.maxHealh, this.highlight, this.interactType);
    }
    Damage() {
        this.health--;
        this.color.Darken(1.07);
        if (this.health <= 0) {
            Terrain.ModifyMapData(this.x, this.y, PerlinPixel(this.x, this.y));
            return true;
        }
        return false;
    }
    DamageNoDelete() {
        this.health--;
        this.color.Darken(1.07);
        if (this.health <= 0) {
            return true;
        }
        return false;
    }
    FullyHeal() {
        this.health = this.maxHealh;
        this.color = this.defaultColor;
    }
}
class DoorData extends BuildingData {
    /**
     * @constructor
     * @param {rgb} color
     * @param {number} x
     * @param {number} y
     * @param {PixelStatus} walkStatus
     * @param {number} hp
     * @param {_Highlight} highlight
     * @param {InteractType} interactionType
     */
    isOpen;
    constructor(name, color, x, y, walkStatus, hp = 12, highlight = _Highlight.border, interactionType) {
        super(name, color, x, y, walkStatus, hp, highlight, interactionType);
        this.isOpen = false;
    }
    at(x, y) {
        return new DoorData(this.name, this.defaultColor.newSlightlyRandom(30), x, y, this.walkStatus, this.maxHealh, this.highlight, this.interactType);
    }
    Open() {
        if (this.isOpen)
            return;
        this.walkStatus = PixelStatus.taken;
        this.color = this.color.changeBy(-30);
        this.highlight = _Highlight.lightBorder;
        this.isOpen = true;
    }
    Close() {
        if (!this.isOpen)
            return;
        this.walkStatus = PixelStatus.block;
        this.color = this.color.changeBy(+30);
        this.highlight = _Highlight.slash;
        this.isOpen = false;
    }
}
let interactCol = new rgb(60, 60, 60);
function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}
class GameTime {
    /**
     * Creates a time object
     * @constructor
     */
    time = 0;
    maxTime = 1000; //default: 1000
    lightLevel = 5;
    minLightLevel = 30;
    triggeredNight = false;
    triggeredDay = false;
    constructor() {
        this.time = this.maxTime * 0.4;
    }
    /**
     * Updates the time object
     */
    Tick() {
        this.time++;
        if (this.time % 1 == 0)
            CalculateLightMap();
        if (this.GetDayProgress() <= 0.2) { //day starts (sun rises)
            this.lightLevel = this.GetDayProgress() * 25;
        }
        else if (this.GetDayProgress() <= 0.3) { //day function triggeres and sun brightness is maxxed
            this.OnDayStart();
            this.lightLevel = 5;
        }
        else if (this.GetDayProgress() >= 0.7) { // night begins (sun sets)
            //after 80% of the day/night cycle toggle full darkness
            if (this.GetDayProgress() >= 0.8) {
                this.OnNightStart();
                this.lightLevel = 0;
                //reset day at midnight
                if (this.GetDayProgress() >= 1)
                    this.time = 0;
            }
            else {
                // Day progress: 0.7 -> 0.8
                //light level: 5 -> 0
                this.lightLevel = 5 - ((this.GetDayProgress() - 0.7) * 50);
            }
        }
        else { // middle of the day
            this.triggeredDay = false;
            this.triggeredNight = false;
        }
        //from 0 - 5 to 0 - 1
        const t = this.lightLevel / 5;
        document.body.style.background = "rgb(" + lerp(99, 255, t) + "," +
            lerp(110, 255, t) + "," + lerp(114, 255, t) + ")";
    }
    OnNightStart() {
        if (this.triggeredNight)
            return;
        //spawns enemies
        this.triggeredNight = true;
    }
    OnDayStart() {
        if (this.triggeredDay)
            return;
        this.triggeredDay = true;
        //heals buildings and deletes all torches
        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                if (mapData[i][j] instanceof BuildingData) {
                    mapData[i][j].FullyHeal();
                    if (mapData[i][j].name == "Torch") {
                        mapData[i][j].BurnOut();
                    }
                }
            }
        }
    }
    GetDayProgress() {
        return this.time / this.maxTime;
    }
}
function BlocksLight(pixel) {
    if (pixel.interactType == InteractType.wall)
        return true;
    if (pixel.interactType == InteractType.stone)
        return true;
    if (pixel.interactType == InteractType.wood)
        return true;
    if (pixel.interactType == InteractType.door && !pixel.isOpen)
        return true;
    return false;
}
class LightData extends BuildingData {
    intensity = 0;
    radius = 0;
    constructor(name, color, x, y, hp = 4, intensity = 2, radius = 3) {
        super(name, color, x, y, PixelStatus.interact, hp, _Highlight.thickBorder, InteractType.light);
        if (intensity > 7)
            console.error("Light intensity is too high: " + intensity);
        this.intensity = intensity;
        this.radius = radius;
    }
    at(x, y) {
        return new LightData(this.name, this.color, x, y, this.maxHealh, this.intensity, this.radius);
    }
    BurnOut() {
        Terrain.ModifyMapData(this.x, this.y, PerlinPixel(this.x, this.y));
    }
}
function castRay(sX, sY, angle, intensity, radius) {
    let x = sX;
    let y = sY;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let i = 0; i < radius; i++) {
        x += dx;
        y += dy;
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        if (ix < 0 || ix >= mapData.length || iy < 0 || iy >= mapData[0].length)
            break;
        const distance = Math.sqrt((ix - sX) ** 2 + (iy - sY) ** 2);
        const lightIntensity = Math.max(0, intensity - distance);
        mapData[ix][iy].Brightness = Math.max(lightIntensity, mapData[ix][iy].Brightness);
        //blocks light
        if (mapData[ix][iy].status == PixelStatus.interact) {
            const pixel = mapData[ix][iy];
            if (BlocksLight(pixel))
                break;
        }
    }
}
function castSunRay(// cestuje a pokud něco najde, tak se na chvili vypne pro iluzi stinu
sX, sY, angle, intensity) {
    const constIntensity = intensity;
    let ShadowTravel = 0;
    let x = sX;
    let y = sY;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let i = 0; true; i++) {
        x += dx;
        y += dy;
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        if (ix < 0 || ix >= mapData.length || iy < 0 || iy >= mapData[0].length)
            break;
        if (ShadowTravel == 0)
            intensity = constIntensity;
        mapData[ix][iy].Brightness = clamp(intensity, 5, mapData[ix][iy].Brightness);
        //blocks light 
        if (mapData[ix][iy].status == PixelStatus.interact) {
            const pixel = mapData[ix][iy];
            if (BlocksLight(pixel)) {
                ShadowTravel = 4;
                intensity = constIntensity / 1.4;
            }
            ;
        }
        if (ShadowTravel > 0) {
            ShadowTravel--;
        }
    }
}
function CalculateLightMap() {
    const numRays = 72;
    let lightSources = [];
    for (let i = 0; i < mapData.length; i++) {
        for (let j = 0; j < mapData[0].length; j++) {
            mapData[i][j].Brightness = 0;
            if (mapData[i][j] instanceof LightData)
                lightSources.push(mapData[i][j]);
        }
    }
    for (const light of lightSources) {
        for (let i = 0; i < numRays; i++) {
            const angle = (Math.PI * 2 / numRays) * i;
            castRay(light.x, light.y, angle, light.intensity, light.radius);
        }
    }
    //sun
    const sunAngle = (Math.floor(Math.PI * gTime.GetDayProgress() * 100 / 5) / 100) * 5;
    for (let i = 0; i < mapData[0].length; i++) {
        castSunRay(0, i, sunAngle, gTime.lightLevel);
        castSunRay(mapData.length, i, sunAngle, gTime.lightLevel);
    }
    for (let i = 0; i < mapData.length; i++) {
        castSunRay(i, 0, sunAngle, gTime.lightLevel);
    }
    //player emits a little light
    for (let i = 0; i < numRays; i++) {
        const angle = (Math.PI * 2 / numRays) * i;
        castRay(Player.x, Player.y, angle, 2, 2);
    }
}
/// <reference path="PixelData.ts" />
/// <reference path="Lighting.ts" />
let buildButtons = document.getElementsByClassName("Selection-Button-Div")[0].querySelectorAll("button");
const BuildType = {
    Wall: 0,
    Floor: 1,
};
let Building = [
    {
        build: new BuildingData("Cheap Wall", new rgb(244, 211, 94), 1, 1, PixelStatus.block, 3, _Highlight.border, InteractType.wall),
        cost: { stone: 0, wood: 3 },
        label: "Cheap but weak"
    },
    {
        build: new BuildingData("Wooden Wall", new rgb(127, 79, 36), 1, 1, PixelStatus.block, 12, _Highlight.border, InteractType.wall),
        cost: { stone: 0, wood: 10 },
        label: "Stronger but more expensive"
    },
    {
        build: new BuildingData("Stone Wall", new rgb(85, 85, 85), 1, 1, PixelStatus.block, 24, _Highlight.border, InteractType.wall),
        cost: { stone: 15, wood: 2 },
        label: "Strong but expensive"
    },
    {
        build: new BuildingData("Cheap Floor", new rgb(255, 243, 176), 1, 1, PixelStatus.taken, 1, _Highlight.none, InteractType.floor),
        cost: { stone: 0, wood: 1 },
        label: "Not the prettiest"
    },
    {
        build: new BuildingData("Wooden Floor", new rgb(175, 164, 126), 1, 1, PixelStatus.taken, 3, _Highlight.none, InteractType.floor),
        cost: { stone: 0, wood: 2 },
        label: "Decent looking"
    },
    {
        build: new BuildingData("Stone Floor", new rgb(206, 212, 218), 1, 1, PixelStatus.taken, 6, _Highlight.none, InteractType.floor),
        cost: { stone: 2, wood: 0 },
        label: "Build with unforseen quality"
    },
    {
        build: new DoorData("Cheap Door", new rgb(255, 231, 230), 1, 1, PixelStatus.block, 3, _Highlight.slash, InteractType.door),
        cost: { stone: 0, wood: 10 },
        label: "Gets you thru the night"
    },
    {
        build: new DoorData("Wooden Door", new rgb(200, 180, 166), 1, 1, PixelStatus.block, 12, _Highlight.slash, InteractType.door),
        cost: { stone: 0, wood: 20 },
        label: "Feels like home"
    },
    {
        build: new DoorData("Stone Door", new rgb(200, 200, 200), 1, 1, PixelStatus.block, 24, _Highlight.slash, InteractType.door),
        cost: { stone: 25, wood: 2 },
        label: "A door that will last"
    },
    {
        build: new LightData("Torch", new rgb(255, 255, 0), 1, 1, 4, 5, 5),
        cost: { stone: 2, wood: 25 },
        label: "Lights up the night, burns out by sunrise"
    },
];
let SelectedBuilding = Building[0];
document.getElementById("Selected-Building-Label").innerHTML = SelectedBuilding.build.name + " - " + SelectedBuilding.label;
document.getElementById("C-Wood").innerHTML = '<img src="Icons/wood.png">: ' + SelectedBuilding.cost.wood;
document.getElementById("C-Stone").innerHTML = '<img src="Icons/stone.png">: ' + SelectedBuilding.cost.stone;
let buildId = 0;
function SelectBuilding(id) {
    //unselect previously selected building
    buildButtons[buildId].id = "Unselected";
    //select new building
    buildButtons[id].id = "Selected";
    //update buildId variable
    buildId = id;
    UpdateSelectedBuilding();
}
function cheat() {
    Resources.stone += 1000;
    Resources.wood += 1000;
    Render.UpdateResourcesScreen();
}
/**
 * Returns the id of the selected material
 * @returns {number}
 */
function GetSelectedMaterialId() {
    const option = document.getElementById("Material-Select").value;
    return Number.parseInt(option);
}
function UpdateSelectedBuilding() {
    let id = buildId;
    //for building that have selectale materials use special treatment
    if (buildId <= 2) {
        const materialId = GetSelectedMaterialId();
        id = buildId * 3 + materialId;
    }
    else {
        id = 6 + buildId;
    }
    SelectedBuilding = Building[id];
    //update label
    document.getElementById("Selected-Building-Label").innerHTML = SelectedBuilding.build.name + " - " + SelectedBuilding.label;
    //update cost display
    document.getElementById("C-Wood").innerHTML = '<img src="Icons/wood.png">: ' + SelectedBuilding.cost.wood;
    document.getElementById("C-Stone").innerHTML = '<img src="Icons/stone.png">: ' + SelectedBuilding.cost.stone;
}
function canPlaceBuildingOn(pixel) {
    if (Player.OverlapPixel.status == PixelStatus.free)
        return true;
    //if the pixel is interactable
    if (Player.OverlapPixel.status == PixelStatus.interact && Player.OverlapPixel instanceof InteractData) {
        //if the ground is a floor and the player is not attempting to place a floor return true
        if (Player.OverlapPixel.interactType == InteractType.floor &&
            !(SelectedBuilding.build.interactType == InteractType.floor))
            return true;
    }
    return false;
}
function Build(Building) {
    if (Resources.stone >= Building.cost.stone
        && Resources.wood >= Building.cost.wood) {
        Resources.stone -= Building.cost.stone;
        Resources.wood -= Building.cost.wood;
        Player.OverlapPixel = Building.build.at(Player.x, Player.y);
        Render.UpdateResourcesScreen();
        isBuilding = true;
    }
}
class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
let MovementVector = new Vector2(0, 0);
let usedInput = false;
let inputPresses = [];
let removeInputValues = [];
//calls repeatedly on key hold
function onKeyDown(event) {
    switch (event.keyCode) {
        case 87: //W
            if (MovementVector.y != -1) {
                MovementVector.y = -1;
                usedInput = false;
            }
            break;
        case 65: //A
            if (MovementVector.x != -1) {
                MovementVector.x = -1;
                usedInput = false;
            }
            break;
        case 83: //S
            if (MovementVector.y != 1) {
                MovementVector.y = 1;
                usedInput = false;
            }
            break;
        case 68: //D
            if (MovementVector.x != 1) {
                MovementVector.x = 1;
                usedInput = false;
            }
            break;
        default:
            //for other keys add to input presses array
            if (!inputPresses.includes(event.keyCode)) {
                inputPresses.push(event.keyCode);
                usedInput = false;
            }
            break;
    }
    //if(event.keyCode >= 49 && event.keyCode <= 57) SelectBuilding(event.keyCode - 49);
}
let clearMap = { xMinus: false, xPlus: false, yMinus: false, yPlus: false };
//calls once on key release
function onKeyUp(event) {
    //clear movement vector if it was registered ingame
    if (usedInput) {
        switch (event.keyCode) {
            case 87:
                if (MovementVector.y == -1)
                    MovementVector.y = 0;
                break;
            case 68:
                if (MovementVector.x == 1)
                    MovementVector.x = 0;
                break;
            case 83:
                if (MovementVector.y == 1)
                    MovementVector.y = 0;
                break;
            case 65:
                if (MovementVector.x == -1)
                    MovementVector.x = 0;
                break;
            default:
                if (inputPresses.includes(event.keyCode))
                    inputPresses.splice(inputPresses.indexOf(event.keyCode), 1);
                break;
        }
        return;
    }
    //if the key was not registered ingame, designate for later removal
    switch (event.keyCode) {
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
function UpdateInput() {
    usedInput = true;
    //clears any movement vector if its designated for clearing
    if (clearMap.xMinus) {
        if (MovementVector.x == -1)
            MovementVector.x = 0;
        clearMap.xMinus = false;
    }
    if (clearMap.xPlus) {
        if (MovementVector.x == 1)
            MovementVector.x = 0;
        clearMap.xPlus = false;
    }
    if (clearMap.yMinus) {
        if (MovementVector.y == -1)
            MovementVector.y = 0;
        clearMap.yMinus = false;
    }
    if (clearMap.yPlus) {
        if (MovementVector.y == 1)
            MovementVector.y = 0;
        clearMap.yPlus = false;
    }
    //removes any keys that were designated for removal
    if (removeInputValues.length > 0) {
        removeInputValues.forEach(value => {
            if (inputPresses.includes(value))
                inputPresses.splice(inputPresses.indexOf(value), 1);
        });
        removeInputValues = [];
    }
}
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);
function RandomUsingSeed(seed) {
    const m = 0x80000000; // 2**31
    const a = 1103515245;
    const c = 12345;
    let state = seed;
    return function () {
        state = (a * state + c) % m;
        return state / (m - 1);
    };
}
class PerlinNoise {
    rnd;
    permutation;
    gradients;
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
        return (this.lerp(x1, x2, v) + 1) / 2;
    }
    perlinColorTerrain(x, y) {
        const value = this.perlin(x, y);
        //ocean
        if (value > 0.7)
            return {
                r: value * 10,
                g: value * 10,
                b: value * 400,
                s: PixelStatus.block
            };
        //sand
        if (value > 0.62)
            return {
                r: value * 255 + 30,
                g: value * 255 + 30,
                b: value * 10,
                s: PixelStatus.free
            };
        //hills or rock (probably delete later)
        //if(value < 0.25) return `rgb(${255 - value * 170}, ${255 - value * 170}, ${255 - value * 170})`;
        //grass
        return {
            r: value * 50,
            g: 240 - value * 90,
            b: value * 50,
            s: PixelStatus.free
        };
    }
    pixel(x, y) {
        return this.perlinColorTerrain(x, y);
    }
}
let Perlin = new PerlinNoise(Math.random() * 1000); //TODO add custom seed
/**
 * Linear interpolation from a to b with t
 */
function lerp(a, b, t) {
    return a + t * (b - a);
}
//Class for rendering the game
class Renderer {
    /**
     * Creates a renderer object for the canvas
     * @constructor
     */
    constructor() {
        this.init();
        this.Draw();
    }
    /**
     * Initialises the canvas and fills it with perlin noise
     */
    init() {
        if (canvas.width % canvasScale != 0 || canvas.height % canvasScale != 0)
            console.error('Canvas size is not divisible by scale');
        // 16 : 10 resolution
        for (let i = 0; i < 80; i++) {
            mapData[i] = [];
            for (let j = 0; j < 50; j++) {
                mapData[i][j] = PerlinPixel(i, j);
            }
        }
        window.addEventListener('resize', this.UpdateWindowSize);
        this.UpdateWindowSize();
        console.log("initialised canvas with array of X:" + mapData.length + " Y:" + mapData[0].length);
    }
    renderLight = false;
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        const ctx = canvas.getContext('2d');
        ctx.beginPath(); //Clear ctx from prev. frame
        for (let i = 0; i < canvas.width / canvasScale; i++) {
            for (let j = 0; j < canvas.height / canvasScale; j++) {
                const pixel = mapData[i][j];
                if (!this.renderLight)
                    ctx.fillStyle = pixel.color.getWithLight(pixel.Brightness);
                else
                    ctx.fillStyle = "rgb(" + pixel.Brightness * 50 + "," + pixel.Brightness * 50 + "," + pixel.Brightness * 50 + ")";
                ctx.fillRect(i * canvasScale, j * canvasScale, canvasScale, canvasScale);
            }
        }
        this.DrawInteractIndicator();
        ctx.strokeStyle = Player.borderColor.getWithLight(Math.max(0.35, mapData[Player.x][Player.y].Brightness));
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x * canvasScale + 1, Player.y * canvasScale + 1, canvasScale - 2, canvasScale - 2);
    }
    DrawInteractIndicator() {
        if (canvasScale < 6)
            return;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                const pixel = mapData[i][j];
                if (pixel.status == PixelStatus.interact) {
                    switch (pixel.highlight) {
                        case _Highlight.none:
                            break;
                        case _Highlight.lightBorder:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 1;
                            ctx.strokeRect(i * canvasScale, j * canvasScale, canvasScale - 1, canvasScale - 1);
                            break;
                        case _Highlight.border:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i * canvasScale + 1, j * canvasScale + 1, canvasScale - 2, canvasScale - 2);
                            break;
                        case _Highlight.thickBorder:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 4;
                            ctx.strokeRect(i * canvasScale + 2, j * canvasScale + 2, canvasScale - 4, canvasScale - 4);
                            break;
                        case _Highlight.slash:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i * canvasScale + 1, j * canvasScale + 1, canvasScale - 2, canvasScale - 2);
                            ctx.moveTo(i * canvasScale + 1, j * canvasScale + 1);
                            ctx.lineTo(i * canvasScale + canvasScale - 1, j * canvasScale + canvasScale - 1);
                            break;
                    }
                }
            }
        }
        ctx.lineWidth = 2;
        ctx.stroke(); //write all the diagonal lines
    }
    /**
     * Updates the resource count on the screen
     */
    UpdateResourcesScreen() {
        document.getElementById("stone").innerHTML = ": " + Resources.stone;
        document.getElementById("wood").innerHTML = ": " + Resources.wood;
    }
    UpdateWindowSize() {
        canvasScale = Math.floor(window.innerWidth / 140);
        if (mapData[0].length * canvasScale > window.innerHeight * 0.8)
            canvasScale = Math.floor(window.innerHeight * 0.7 / mapData[0].length);
        canvas.width = mapData.length * canvasScale;
        canvas.height = mapData[0].length * canvasScale;
    }
}
//Class for terrain modification
class TerrainManipulator {
    /**
     * Inserts a pixel at the given position
     * @param {number} x
     * @param {number} y
     * @param {PixelData} PixelData
     */
    ModifyMapData(x, y, PixelData) {
        mapData[x][y] = PixelData;
    }
    /**
     *
     * @param {Array<Array<PixelData>>} NewMapData
     * @returns
     */
    InsertMapDataRaw(NewMapData) {
        if (mapData.length != NewMapData.length || mapData[0].length != NewMapData[0].length) {
            console.error('Map size is not matched');
            return;
        }
        mapData = NewMapData;
    }
    /**
     * Inserts a interactable pixel at the pixel inner position
     * @param {InteractData} Pixel
     */
    InsertResourcePixel(Pixel) {
        Terrain.ModifyMapData(Pixel.x, Pixel.y, Pixel);
        switch (Pixel.interactType) {
            case InteractType.stone:
                ResourceTerrain.stone++;
                break;
            case InteractType.wood:
                ResourceTerrain.wood++;
                break;
        }
    }
    /**
     * Deletes the interactable pixel at the given X,Y position
     * @param {number} pX
     * @param {number} pY
     * @throws {ReferenceError} No interactable type at that location
     */
    DeleteResourcePixel(pX, pY) {
        if (mapData[pX][pY].status != PixelStatus.interact)
            throw new ReferenceError("No resource type at that location");
        switch (mapData[pX][pY].interactType) {
            case InteractType.stone:
                ResourceTerrain.stone--;
                break;
            case InteractType.wood:
                ResourceTerrain.wood--;
                break;
            default:
                throw new ReferenceError("Unknown resource type");
        }
        this.ModifyMapData(pX, pY, PerlinPixel(pX, pY));
    }
    /**
     * Clears the map and fills it with perlin noise
     */
    Clear() {
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                mapData[i][j] = PerlinPixel(i, j);
            }
        }
    }
    /**
     * Hadles safe player movement
     * @param {PlayerData} Player
     * @param {Number} x
     * @param {Number} y
     */
    MovePlayer(Player, x, y) {
        //if player is not building allow diagonal movement else only move non-diagonaly
        if (!isBuilding) {
            Terrain.MovePlayerRaw(Player, MovementVector.x, 0);
            Terrain.MovePlayerRaw(Player, 0, MovementVector.y);
        }
        else {
            if (MovementVector.x != 0)
                MovementVector.y = 0;
            Terrain.MovePlayerRaw(Player, MovementVector.x, MovementVector.y);
        }
    }
    /**
     * Moves the given player by the X and Y amount
     * @param {PlayerData} Player
     * @param {Number} x
     * @param {Number} y
     */
    MovePlayerRaw(Player, x, y) {
        let mPixel = mapData[Player.x + x][Player.y + y];
        //check if the player can move to the given position
        if (mPixel.status == PixelStatus.free || mPixel.status == PixelStatus.taken ||
            (mPixel.status == PixelStatus.interact && mPixel.walkStatus == PixelStatus.taken)) { // ??
            //move the player
            //if is player exiting a door, lock it
            if (Player.OverlapPixel.status == PixelStatus.interact &&
                Player.OverlapPixel.interactType == InteractType.door && (x != 0 || y != 0)) {
                Player.OverlapPixel.Close();
            }
            this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
            Player.x += x;
            Player.y += y;
            Player.OverlapPixel = mapData[Player.x][Player.y];
            this.ModifyMapData(Player.x, Player.y, new PixelData(Player.color));
        }
        else if (mPixel.status == PixelStatus.interact && mPixel.interactType == InteractType.door) {
            mPixel.Open();
        }
    }
    /**
     * Forcefully moves the player to a given X and Y position (skips any checks)
     * @param {PlayerData} Player
     * @param {number} x
     * @param {number} y
     */
    ForceMovePlayer(Player, x, y) {
        this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
        Player.x += x;
        Player.y += y;
        Player.OverlapPixel = mapData[Player.x][Player.y];
        this.ModifyMapData(Player.x, Player.y, new PixelData(Player.color));
    }
    /**
     * Tries to generate a random resource on the map
     */
    GenerateRandomResource() {
        let rand = Math.random();
        const spawnArea = 12;
        let centerVec = {
            x: Math.floor(mapData.length / 2),
            y: Math.floor(mapData[0].length / 2),
        };
        let pX;
        let pY;
        //gets a position outside of spawn area
        do {
            pX = Math.floor((Math.random() * mapData.length - 2) + 1);
            pY = Math.floor((Math.random() * mapData[0].length - 2) + 1);
        } while (((pX > centerVec.x - spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y - spawnArea && pY < centerVec.y + spawnArea)));
        if (rand < (ResourceTerrain.wood / ResourceTerrain.stone) / 3)
            this.GenerateStone(pX, pY);
        else
            this.GenerateTree(pX, pY);
    }
    /**
     * Generates a tree at the given position (mainly for internal use)
     * @param {number} x
     * @param {number} y
     */
    GenerateTree(x, y) {
        if (ResourceTerrain.wood + 5 > MaxTResource.wood)
            return;
        //check if there is a space for the tree in a 3x3 grid
        for (let i = x - 1; i <= x + 1; i++) {
            if (i < 0 || i > mapData.length)
                return;
            for (let j = y - 1; j <= y + 1; j++) {
                if (j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.free)
                    return;
            }
        }
        const tPixel = new InteractData(new rgb(200, 70, 50), x, y, InteractType.wood);
        Terrain.InsertResourcePixel(tPixel);
        let lPixel = new InteractData(new rgb(49, 87, 44), x + 1, y, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x - 1, y, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x, y + 1, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x, y - 1, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
    }
    /**
     * Generates a stone at the given position (mainly for internal use)
     * @param {number} x
     * @param {number} y
     */
    GenerateStone(x, y) {
        if (ResourceTerrain.stone + 5 > MaxTResource.stone)
            return;
        //check if stone can freely spawn in a 3x3 grid
        for (let i = x - 1; i <= x + 1; i++) {
            if (i < 0 || i > mapData.length)
                return;
            for (let j = y - 1; j <= y + 1; j++) {
                if (j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.free)
                    return;
            }
        }
        let rPixel;
        rPixel = new InteractData(new rgb(200, 200, 200), x, y, InteractType.stone);
        Terrain.InsertResourcePixel(rPixel);
        let sPixel = new InteractData(new rgb(200, 200, 200), x, y, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x + 1, y, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x - 1, y, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x, y + 1, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x, y - 1, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        let stoneVec = { x: 1, y: 1 };
        let repeats = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < repeats; i++) {
            stoneVec.x = Math.floor(Math.random() * 2) - 1;
            stoneVec.y = Math.floor(Math.random() * 2) - 1;
            if (stoneVec.x == 0)
                stoneVec.x = 1;
            if (stoneVec.y == 0)
                stoneVec.y = 1;
            sPixel = new InteractData(new rgb(200, 200, 200), x + stoneVec.x, y + stoneVec.y, InteractType.stone);
            Terrain.InsertResourcePixel(sPixel);
        }
    }
}
/// <reference path="RTClass.ts" />
/// <reference path="Lighting.ts" />
//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker").style.display = isMobile ? "block" : "none";
const canvas = document.getElementById('gameCanvas');
let canvasScale = 10;
const gTime = new GameTime();
let mapData = [];
let ResourceTerrain = {
    stone: 0,
    wood: 0
};
const MaxTResource = {
    stone: 20,
    wood: 30
};
//sets player position in the middle of the map
let Player = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), Math.floor(canvas.width / canvasScale / 2), Math.floor(canvas.height / canvasScale / 2));
let Render = new Renderer();
let Terrain = new TerrainManipulator();
setInterval(UpdateInteractionIndicator, 1000);
let Resources = {
    stone: 0,
    wood: 0,
};
function Start() {
    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Render.Draw();
    for (let i = 0; i < 20; i++) {
        Terrain.GenerateRandomResource();
    }
    cheat();
}
let isBuilding = false;
function Update() {
    //movement checker
    const moveTile = mapData[Player.x + MovementVector.x][Player.y + MovementVector.y];
    //placement logic
    isBuilding = false;
    if (inputPresses.includes(69) && canPlaceBuildingOn(Player.OverlapPixel)) {
        Build(SelectedBuilding);
    }
    //digging underneath player logic
    if (inputPresses.includes(81)) {
        //if standing on a building damage it
        if (Player.OverlapPixel instanceof BuildingData) {
            let brokePixel = Player.OverlapPixel.DamageNoDelete();
            if (brokePixel) {
                Player.OverlapPixel = PerlinPixel(Player.x, Player.y);
            }
        }
    }
    //movement interactions
    if (moveTile.status == PixelStatus.interact && moveTile instanceof InteractData) {
        let brokePixel;
        switch (moveTile.interactType) {
            case InteractType.stone:
                brokePixel = moveTile.Damage();
                if (brokePixel)
                    Resources.stone += Math.floor(1 + Math.random() * 2);
                break;
            case InteractType.wood:
                brokePixel = moveTile.Damage();
                if (brokePixel)
                    Resources.wood += Math.floor(1 + Math.random() * 2);
                break;
            case InteractType.wall:
                moveTile.Damage();
                break;
            case InteractType.floor:
            case InteractType.door:
                if (MovementVector.x == 0 && MovementVector.y == 0)
                    break;
                //ignore door and floor
                Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
                break;
        }
        Render.UpdateResourcesScreen();
    }
    else if (!(MovementVector.x == 0 && MovementVector.y == 0)) {
        Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
    }
    UpdateInput();
    //Resource spawner
    if (Math.random() > 0.98) {
        Terrain.GenerateRandomResource();
    }
    gTime.Tick();
    Render.Draw();
}
function UpdateInteractionIndicator() {
    if (interactCol.get() == new rgb(60, 60, 60).get())
        interactCol = new rgb(50, 50, 50);
    else
        interactCol = new rgb(60, 60, 60);
}
function GetPixelInfo(x, y) {
    return mapData[x][y];
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000 / tickSpeed);
