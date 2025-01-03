"use strict";
class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    flip() {
        return new Vector2(this.x * -1, this.y * -1);
    }
    normalize() {
        const mag = this.magnitude();
        return new Vector2(Math.floor(this.x / mag), Math.floor(this.y / mag));
    }
    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
}
const SidesDir = [
    new Vector2(0, 1), new Vector2(-1, 0), new Vector2(1, 0), new Vector2(0, -1)
];
const AroundDir = [
    new Vector2(0, 1), new Vector2(-1, 0), new Vector2(1, 0), new Vector2(0, -1),
    new Vector2(1, 1), new Vector2(-1, 1), new Vector2(1, -1), new Vector2(-1, -1)
];
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
        const lightShift = Math.min(light / 5, 1.1);
        return `rgb(${Math.floor(this.r * lightShift)},${Math.floor(this.g * lightShift)},${this.b * lightShift})`;
    }
    /**
     * Makes the rgb value darker by the value
     * @param {number} val
     *
     */
    Darker() {
        return new rgb(this.r / 2, this.g / 2, this.b / 2);
    }
    Lerp(other, t) {
        return new rgb(Math.floor(lerp(this.r, other.r, t)), Math.floor(lerp(this.g, other.g, t)), Math.floor(lerp(this.b, other.b, t)));
    }
    MixWith(other, t) {
        return new rgb(Math.floor(lerp(this.r, other.r, t)), Math.floor(lerp(this.g, other.g, t)), Math.floor(lerp(this.b, other.b, t)));
    }
}
/**
 * Linear interpolation from a to b with t
 */
function lerp(a, b, t) {
    return a + t * (b - a);
}
/// <reference path="SupportClasses.ts" />
var PixelStatus;
/// <reference path="SupportClasses.ts" />
(function (PixelStatus) {
    PixelStatus[PixelStatus["walkable"] = 0] = "walkable";
    PixelStatus[PixelStatus["breakable"] = 1] = "breakable";
    PixelStatus[PixelStatus["block"] = 2] = "block";
    PixelStatus[PixelStatus["interact"] = 3] = "interact";
})(PixelStatus || (PixelStatus = {}));
;
var HighlightPixel;
(function (HighlightPixel) {
    HighlightPixel[HighlightPixel["none"] = 0] = "none";
    HighlightPixel[HighlightPixel["lightBorder"] = 1] = "lightBorder";
    HighlightPixel[HighlightPixel["border"] = 2] = "border";
    HighlightPixel[HighlightPixel["thickBorder"] = 3] = "thickBorder";
    HighlightPixel[HighlightPixel["slash"] = 4] = "slash";
})(HighlightPixel || (HighlightPixel = {}));
;
class PixelData {
    color;
    status;
    Brightness = 0;
    Indoors = false;
    constructor(color, status = PixelStatus.walkable) {
        this.color = color;
        this.status = status;
    }
}
var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["ground"] = 0] = "ground";
    TerrainType[TerrainType["sand"] = 1] = "sand";
    TerrainType[TerrainType["water"] = 2] = "water";
})(TerrainType || (TerrainType = {}));
class TerrainData extends PixelData {
    type;
    constructor(color, status, type) {
        super(color, status);
        this.type = type;
    }
}
const nullPixel = new TerrainData(new rgb(0, 0, 0), PixelStatus.walkable, TerrainType.water);
function PerlinPixel(x, y) {
    const pColor = Terrain.perlin.perlinColorTerrain(x / 9, y / 9);
    return new TerrainData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s, pColor.t);
}
function IsDamageable(entity) {
    return entity.Damage !== undefined;
}
function IsHighlightable(entity) {
    return entity.Highlight !== undefined;
}
class EntityData extends PixelData {
    x;
    y;
    HighlightColor;
    Highlight = HighlightPixel.border;
    OverlapPixel;
    Health;
    MaxHealth;
    constructor(color, status = PixelStatus.walkable, x, y, BorderColor, EntityHealth) {
        super(color, status);
        this.x = x;
        this.y = y;
        this.HighlightColor = BorderColor;
        this.Health = EntityHealth;
        this.OverlapPixel = PerlinPixel(x, y);
        this.MaxHealth = this.Health;
    }
    Damage(damage) {
        this.Health -= Math.min(damage, this.Health);
        if (this.Health <= 0) {
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy() {
        this.Die();
    }
}
class PlayerData extends EntityData {
    respawnTime = 0;
    constructor(color, HighlightColor, x, y, Health) {
        super(color, PixelStatus.block, x, y, HighlightColor, Health);
    }
    Damage(damage) {
        this.Health -= Math.min(damage, this.Health);
        document.getElementById("Health").innerHTML = "HP: " + this.Health.toString().padStart(2, "0");
        if (this.Health <= 0) {
            this.Die();
            return true;
        }
        return false;
    }
    Heal(heal) {
        this.Health = Math.min(this.Health + heal, this.MaxHealth);
        document.getElementById("Health").innerHTML = "HP: " + this.Health.toString().padStart(2, "0");
    }
    SetHP(health) {
        this.Health = Math.min(health, this.MaxHealth);
        document.getElementById("Health").innerHTML = "HP: " + this.Health.toString().padStart(2, "0");
    }
    FindAndSetSpawnPos() {
        let pos = new Vector2(Math.floor(canvas.width / canvasScale / 2), Math.floor(canvas.height / canvasScale / 2));
        //find a valid spawn position
        while (Terrain.ins.mapData[pos.x][pos.y].status != PixelStatus.walkable) {
            pos.x += Math.floor(Math.random() * 3) - 1;
            pos.y += Math.floor(Math.random() * 3) - 1;
            if (pos.x < 0 || pos.x >= Terrain.ins.MapX())
                pos.x = Math.floor(canvas.width / canvasScale / 2);
            if (pos.y < 0 || pos.y >= Terrain.ins.MapY())
                pos.y = Math.floor(canvas.height / canvasScale / 2);
            pos = new Vector2(pos.x + Math.floor(Math.random() * 3) - 1, pos.y + Math.floor(Math.random() * 3) - 1);
        }
        Terrain.ins.mapData[Player.x][Player.y] = this.OverlapPixel;
        this.x = pos.x;
        this.y = pos.y;
        this.OverlapPixel = Terrain.ins.mapData[this.x][this.y];
        Terrain.ins.mapData[Player.x][Player.y] = this;
    }
    Die() {
        //On death.. respawn and loose half of the resources
        console.log('Player has died.. respawning');
        ResourceManager.ins.resources.forEach(resource => {
            ResourceManager.ins.RemoveResource(resource[0], Math.ceil(resource[1] / 2));
        });
        this.respawnTime = 5;
        this.Heal(this.MaxHealth / 2);
        //despawn all enemies
        EnemyList.forEach(e => e.Despawn());
        this.FindAndSetSpawnPos();
        Save(); //there is no escape from the punishment of death 😱😨
    }
    MoveBy(x, y) {
        const moveTile = Terrain.ins.mapData[Player.x + x][Player.y + y];
        //mine resources
        if (moveTile instanceof ResourceData) {
            moveTile.Damage(1);
        }
        //break buildings
        else if (moveTile instanceof BuildingData && moveTile.status == PixelStatus.breakable) {
            if (IsDamageable(moveTile))
                moveTile.Damage(1);
            RecipeHandler.ins.UpdatevAvalibleRecipes();
        }
        //interact (ex. doors)
        else if (IsInteractable(moveTile) && moveTile.status == PixelStatus.interact)
            moveTile.Interact();
        //attack enemy
        else if (moveTile instanceof EnemyData)
            moveTile.Damage(1);
        //move to a spot
        else if (!(x == 0 && y == 0)) {
            Terrain.ins.MovePlayer(Player);
            RecipeHandler.ins.UpdatevAvalibleRecipes();
        }
    }
}
class ResourceData extends PixelData {
    Health;
    MaxHealth;
    x;
    y;
    Highlight;
    HighlightColor = new rgb(60, 60, 60);
    DefaultColor;
    ResourceType;
    ResourceID;
    OverlaidPixel;
    OnResourceDestroy;
    constructor(color, status, Health, x, y, Highlight, ResourceType, ResourceID, OverlaidPixel, OnResourceDestroy) {
        super(color, status);
        this.DefaultColor = color.new();
        this.Health = Health;
        this.MaxHealth = Health;
        this.x = x;
        this.y = y;
        this.Highlight = Highlight;
        this.ResourceType = ResourceType;
        this.ResourceID = ResourceID;
        this.OverlaidPixel = OverlaidPixel;
        this.OnResourceDestroy = OnResourceDestroy;
    }
    Damage(damage) {
        this.Health -= damage;
        this.color = this.DefaultColor.Lerp(this.DefaultColor.Darker(), 1 - this.Health / this.MaxHealth);
        if (this.Health <= 0) {
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy() {
        Terrain.ins.DeleteResourcePixel(this.x, this.y, this.OverlaidPixel);
        this.OnResourceDestroy();
        CheckDeleteInterior(this.x, this.y);
    }
}
class BuildingData extends PixelData {
    Health;
    MaxHealth;
    x;
    y;
    Highlight;
    HighlightColor;
    DefaultColor;
    name;
    OverlaidPixel = new TerrainData(new rgb(0, 0, 0), PixelStatus.walkable, TerrainType.ground);
    constructor(name, color, status, Health, x, y, Highlight, HighlightColor = new rgb(80, 80, 80)) {
        super(color, status);
        this.name = name;
        this.Health = Health;
        this.MaxHealth = Health;
        this.x = x;
        this.y = y;
        this.Highlight = Highlight;
        this.DefaultColor = color.new();
        this.HighlightColor = HighlightColor;
    }
    Damage(damage) {
        this.Health -= damage;
        this.color = this.DefaultColor.Lerp(this.DefaultColor.Darker(), 1 - this.Health / this.MaxHealth);
        if (this.Health <= 0) {
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy() {
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlaidPixel);
        CheckDeleteInterior(this.x, this.y);
    }
    DamageNoDestroy(damage) {
        this.Health -= damage;
        this.color = this.DefaultColor.Lerp(this.DefaultColor.Darker(), 1 - this.Health / this.MaxHealth);
        if (this.Health <= 0) {
            return true;
        }
        return false;
    }
    /**
     * Returns this object at the specified coordinates
     * @param {number} x
     * @param {number} y
     * @returns {ThisType}
     */
    at(x, y) {
        const build = new BuildingData(this.name, this.DefaultColor.newSlightlyRandom(30), this.status, this.MaxHealth, x, y, this.Highlight, this.HighlightColor);
        if (Player.x == x && Player.y == y)
            build.OverlaidPixel = Player.OverlapPixel;
        else
            build.OverlaidPixel = Terrain.ins.mapData[x][y];
        return build;
    }
    FullyHeal() {
        this.Health = this.MaxHealth;
        this.color = this.DefaultColor.new();
    }
}
function IsInteractable(entity) {
    return entity.Interact !== undefined;
}
class DoorData extends BuildingData {
    isOpen;
    HighlightColor = new rgb(60, 60, 60);
    constructor(name, color, x, y, hp = 12, highlight = HighlightPixel.slash) {
        super(name, color, PixelStatus.interact, hp, x, y, highlight);
        this.isOpen = false;
    }
    at(x, y) {
        const door = new DoorData(this.name, this.DefaultColor.newSlightlyRandom(30), x, y, this.MaxHealth, this.Highlight);
        if (Player.x == x && Player.y == y)
            door.OverlaidPixel = Player.OverlapPixel;
        else
            door.OverlaidPixel = Terrain.ins.mapData[x][y];
        return door;
    }
    Interact() {
        if (this.isOpen)
            this.Close();
        else
            this.Open();
    }
    Open() {
        if (this.isOpen)
            return;
        this.status = PixelStatus.walkable;
        this.color = this.color.changeBy(-30);
        this.Highlight = HighlightPixel.lightBorder;
        this.isOpen = true;
    }
    Close() {
        if (!this.isOpen)
            return;
        this.status = PixelStatus.interact;
        this.color = this.color.changeBy(+30);
        this.Highlight = HighlightPixel.slash;
        this.isOpen = false;
    }
}
class GlassData extends BuildingData {
    constructor(name, color, x, y, hp = 3) {
        super(name, color, PixelStatus.breakable, hp, x, y, HighlightPixel.lightBorder);
    }
    at(x, y) {
        const glass = new GlassData(this.name, this.DefaultColor.newSlightlyRandom(30), x, y, this.MaxHealth);
        if (Player.x == x && Player.y == y)
            glass.OverlaidPixel = Player.OverlapPixel;
        else
            glass.OverlaidPixel = Terrain.ins.mapData[x][y];
        return glass;
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}
class GameTime {
    static ins;
    /**
     * Creates a time object
     * @constructor
     */
    time = 0;
    day = 0;
    maxTime = 1000; //default: 1000
    lightLevel = 5;
    minLightLevel = 30;
    triggeredNight = true;
    triggeredDay = true;
    constructor() {
        this.time = this.maxTime * 0.25;
    }
    /**
     * Updates the time object
     */
    Tick() {
        //if(QuestManager.ins.activeQuestId > 2) might be dumb
        this.time++;
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
        document.documentElement.style.setProperty('--light-level', t.toString());
        document.getElementById("Time").innerHTML = GameTime.ins.GetDayTime(); //shows time
        CalculateLightMap();
    }
    OnNightStart() {
        if (this.triggeredNight)
            return;
        this.triggeredNight = true;
        //dont spawn enemies on first two quests
        if (QuestManager.ins.activeQuestId < 2)
            return;
        if (gamemode == "peaceful")
            return;
        let numOfEnemies = Math.min(4, Math.max(1, Math.floor(Math.random() * (this.day / 10) + 1)));
        if (this.SpawnRaidEnemies())
            numOfEnemies += 1;
        this.SpawnEnemies(numOfEnemies);
    }
    SpawnEnemies(amount) {
        let SpawnedEnemies = 0;
        let iteration = 0;
        while (SpawnedEnemies < amount && iteration < 70 && EnemyList.length < 5) {
            iteration++;
            //generate a random position on the edge of the map
            let x = Math.random() < 0.5 ? (Math.random() < 0.5 ? 0 : Terrain.ins.MapX() - 1) : Math.floor(Math.random() * (Terrain.ins.MapX() - 1)) + 1;
            let y;
            if (x === 0 || x === Terrain.ins.MapX() - 1)
                y = Math.floor(Math.random() * Terrain.ins.MapY());
            else
                y = Math.random() < 0.5 ? 0 : Terrain.ins.MapY() - 1;
            if (GameTime.CanSpawEnemyAt(x, y)) {
                new EnemyData(new rgb(214, 40, 40), new rgb(245, 124, 0), x, y, 2); //create enemy - automatically adds itself to EnemyList
                SpawnedEnemies++;
            }
        }
    }
    static CanSpawEnemyAt(x, y) {
        if (x < 0 || x >= Terrain.ins.MapX() || y < 0 || y >= Terrain.ins.MapY())
            return false;
        if (Terrain.ins.mapData[x][y].status != PixelStatus.walkable)
            return false;
        if (Terrain.ins.mapData[x][y].Indoors)
            return false;
        if (Terrain.ins.mapData[x][y] instanceof BuildingData)
            return false;
        //if(Terrain.ins.mapData[x][y].Brightness > 1.5) return false;
        return true;
    }
    SpawnRaidEnemies() {
        return this.day % 5 == 0 && this.day > 0;
    }
    OnDayStart() {
        if (this.triggeredDay)
            return;
        this.triggeredDay = true;
        //heals buildings and deletes all torches
        for (let i = 0; i < Terrain.ins.MapX(); i++) {
            for (let j = 0; j < Terrain.ins.MapY(); j++) {
                if (Terrain.ins.mapData[i][j] instanceof BuildingData) {
                    Terrain.ins.mapData[i][j].FullyHeal();
                    if (Terrain.ins.mapData[i][j].name == "Torch")
                        Terrain.ins.mapData[i][j].BurnOut();
                }
                else if (Terrain.ins.mapData[i][j] instanceof EnemyData)
                    Terrain.ins.mapData[i][j].Die();
            }
        }
        this.day++;
        Save();
        this.UpdateDayDisplay();
    }
    UpdateDayDisplay() {
        if (gamemode == "peaceful") {
            document.getElementById("Game-Day").innerHTML = `Day ${this.day}`;
        }
        else {
            const raidMessage = this.day % 5 == 0 ? "Raid day!" : `${5 - this.day % 5} Day(s) until raid`;
            document.getElementById("Game-Day").innerHTML = `Day ${this.day} <span>| ${raidMessage}</span>`;
        }
    }
    GetDayProgress() {
        return this.time / this.maxTime;
    }
    GetDayTime() {
        let hours = Math.floor(this.GetDayProgress() * 24);
        const minutes = Math.floor(((this.GetDayProgress() * 24 - hours) * 60) / 15) * 15;
        //3 hours offset
        hours = hours + 3;
        if (hours >= 24)
            hours -= 24;
        return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
    }
}
function BlocksLight(pixel) {
    if (pixel instanceof BuildingData) {
        if (pixel instanceof LightData)
            return false;
        if (pixel instanceof GlassData)
            return false;
        if (pixel.status == PixelStatus.block)
            return true;
        if (pixel.status == PixelStatus.breakable)
            return true;
        if (pixel.status == PixelStatus.interact)
            return true;
    }
    if (pixel instanceof ResourceData)
        return true;
    return false;
}
class LightData extends BuildingData {
    intensity = 0;
    radius = 0;
    HighlightColor = new rgb(253, 203, 110);
    constructor(name, color, x, y, hp = 4, intensity = 2, radius = 3) {
        super(name, color, PixelStatus.breakable, hp, x, y, HighlightPixel.thickBorder);
        if (intensity > 7)
            console.error("Light intensity is too high: " + intensity);
        this.intensity = intensity;
        this.radius = radius;
    }
    at(x, y) {
        const light = new LightData(this.name, this.color, x, y, this.MaxHealth, this.intensity, this.radius);
        if (Player.x == x && Player.y == y)
            light.OverlaidPixel = Player.OverlapPixel;
        else
            light.OverlaidPixel = Terrain.ins.mapData[x][y];
        return light;
    }
    BurnOut() {
        this.OverlaidPixel.Indoors = this.Indoors;
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlaidPixel);
    }
}
function castRay(sX, sY, angle, intensity, radius) {
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    //movement with angle for small deviations
    let x = sX - (dx / 100);
    let y = sY - (dy / 100);
    let distance = 0;
    for (let i = 0; distance <= radius; i++) {
        x += dx * .5;
        y += dy * .5;
        const ix = Math.round(x);
        const iy = Math.round(y);
        //stop the light out of bounds
        if (ix < 0 || ix >= Terrain.ins.MapX() || iy < 0 || iy >= Terrain.ins.MapY())
            break;
        distance = Math.sqrt((ix - sX) ** 2 + (iy - sY) ** 2);
        const lightIntensity = Math.max(0, intensity - distance);
        Terrain.ins.mapData[ix][iy].Brightness = Math.max(lightIntensity, Terrain.ins.mapData[ix][iy].Brightness);
        //reflects light
        if (BlocksLight(Terrain.ins.mapData[ix][iy])) {
            return;
            /* refraction sucks :(
            if(true){ //flip along Y - idk fix TODO: try again ?
                hitNormal.y *= -1;
                angle = Math.atan2(hitNormal.y, hitNormal.x);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }else{ //flip along X
                hitNormal.x *= -1;
                angle = Math.atan2(hitNormal.y, hitNormal.x);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }
            Render.DrawGizmoLine(new Vector2(x,y), new Vector2(x + dx, y + dy));
            */
        }
    }
}
function castSunRay(sX, sY, angle, intensity) {
    const constIntensity = intensity;
    let ShadowTravel = 0;
    let HitBuilding = false;
    let x = sX;
    let y = sY;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let i = 0; true; i++) {
        x += dx * .5;
        y += dy * .5;
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        if (ix < 0 || ix >= Terrain.ins.MapX() || iy < 0 || iy >= Terrain.ins.MapY())
            break;
        if (ShadowTravel == 0)
            intensity = constIntensity;
        //indoor light is very dim
        if (!Terrain.ins.mapData[ix][iy].Indoors)
            Terrain.ins.mapData[ix][iy].Brightness = clamp(Terrain.ins.mapData[ix][iy].Brightness, 5, intensity);
        else {
            if (HitBuilding)
                Terrain.ins.mapData[ix][iy].Brightness = clamp(Terrain.ins.mapData[ix][iy].Brightness, Math.max(Terrain.ins.mapData[ix][iy].Brightness, 3), constIntensity / 1.5);
            else
                Terrain.ins.mapData[ix][iy].Brightness = clamp(Terrain.ins.mapData[ix][iy].Brightness, 5, intensity);
        }
        //blocks light 
        if (BlocksLight(Terrain.ins.mapData[ix][iy])) {
            if (Terrain.ins.mapData[ix][iy] instanceof BuildingData)
                HitBuilding = true;
            ShadowTravel = 6;
            intensity = constIntensity / 1.4;
        }
        ;
        if (ShadowTravel > 0) {
            ShadowTravel--;
        }
    }
}
function CalculateLightMap() {
    const numRays = 72;
    let lightSources = [];
    Terrain.ins.IterateMap((pixel, x, y) => {
        pixel.Brightness = 0;
        if (pixel instanceof LightData)
            lightSources.push(pixel);
    });
    for (const light of lightSources) {
        for (let i = 0; i < numRays; i++) {
            const angle = (Math.PI * 2 / numRays) * i;
            //send ray from the middle of the block
            castRay(light.x, light.y, angle, light.intensity, light.radius);
        }
    }
    //sun
    const sunAngle = (Math.floor(Math.PI * GameTime.ins.GetDayProgress() * 100 / 5) / 100) * 5;
    for (let i = 0; i < Terrain.ins.MapY(); i++) {
        castSunRay(0, i, sunAngle, GameTime.ins.lightLevel);
        castSunRay(Terrain.ins.MapX(), i, sunAngle, GameTime.ins.lightLevel);
    }
    for (let i = 0; i < Terrain.ins.MapX(); i++) {
        castSunRay(i, 0, sunAngle, GameTime.ins.lightLevel);
    }
    //player emits a little light
    for (let i = 0; i < (numRays / 2); i++) {
        const angle = (Math.PI * 2 / (numRays / 2)) * i;
        castRay(Player.x + .1, Player.y + .1, angle, 2, 2);
    }
}
var ResourceTypes;
(function (ResourceTypes) {
    ResourceTypes[ResourceTypes["sand"] = 0] = "sand";
    ResourceTypes[ResourceTypes["wood"] = 1] = "wood";
    ResourceTypes[ResourceTypes["stone"] = 2] = "stone";
    ResourceTypes[ResourceTypes["glass"] = 3] = "glass";
    ResourceTypes[ResourceTypes["iron_ore"] = 4] = "iron_ore";
    ResourceTypes[ResourceTypes["iron"] = 5] = "iron";
    ResourceTypes[ResourceTypes["human_meat"] = 6] = "human_meat";
})(ResourceTypes || (ResourceTypes = {}));
class ResourceManager {
    static ins;
    resources = [];
    DisplayStoredResources() {
        const ResouceElements = [];
        this.resources.sort((a, b) => a[0] - b[0]);
        this.resources.forEach(x => {
            const container = document.createElement('div');
            if (x[0] == ResourceTypes.human_meat) {
                container.classList.add('Clickable-Resource');
                container.onclick = () => {
                    if (this.RemoveResource(ResourceTypes.human_meat, 1))
                        Player.Heal(1);
                };
            }
            const image = document.createElement('img');
            const text = document.createElement('p');
            image.src = '../Icons/' + ResourceTypes[x[0]] + '.png';
            image.title = ResourceTypes[x[0]].toString().replace('_', ' ');
            text.innerHTML = x[1].toString().padStart(4, "0");
            container.appendChild(image);
            container.appendChild(text);
            ResouceElements.push(container);
        });
        if (ResouceElements.length == 0)
            document.getElementById("resources").replaceChildren(document.createElement('hr'));
        else
            document.getElementById("resources").replaceChildren(...ResouceElements);
        RecipeHandler.ins.DisplayAvalibleRecipes();
    }
    DisplayCostResources(resources) {
        const ResouceElements = [];
        const text = document.createElement('p');
        text.classList.add('Cost-Build');
        text.innerHTML = "Cost:";
        ResouceElements.push(text);
        resources.resources.forEach(x => {
            const container = document.createElement('p');
            container.innerHTML =
                '<img src="../Icons/' + ResourceTypes[x[0]] + '.png" title="' + ResourceTypes[x[0]].toString().replace('_', ' ') + '">: ' + x[1];
            ResouceElements.push(container);
        });
        document.getElementsByClassName("Cost-List")[0].replaceChildren(...ResouceElements);
    }
    Cheat() {
        this.AddResourceList(new ResourceList()
            .Add(ResourceTypes.wood, 1000)
            .Add(ResourceTypes.stone, 1000)
            .Add(ResourceTypes.glass, 1000)
            .Add(ResourceTypes.iron, 1000)
            .Add(ResourceTypes.human_meat, 10));
    }
    GetResourceAmount(type) {
        const resource = this.resources.filter(x => x[0] == type)[0];
        if (resource == undefined)
            return 0;
        return resource[1];
    }
    AddResource(type, amount) {
        const resource = this.resources.filter(x => x[0] == type)[0];
        if (resource == undefined) {
            if (amount <= 0)
                return;
            this.resources.push([type, amount]);
        }
        else
            this.resources.filter(x => x[0] == type)[0][1] += amount;
        this.DisplayStoredResources();
        //Quests:
        if (QuestManager.ins.GetActiveQuest() instanceof ResourceQuest) {
            const quest = QuestManager.ins.GetActiveQuest();
            quest.CheckCompleteQuest(type, amount);
        }
    }
    AddResourceNoQuest(type, amount) {
        const resource = this.resources.filter(x => x[0] == type)[0];
        if (resource == undefined) {
            if (amount <= 0)
                return;
            this.resources.push([type, amount]);
        }
        else
            this.resources.filter(x => x[0] == type)[0][1] += amount;
        this.DisplayStoredResources();
    }
    AddResourceList(list) {
        list.resources.forEach(x => this.AddResource(x[0], x[1]));
    }
    RemoveResource(type, amount) {
        const resource = this.resources.filter(x => x[0] == type)[0];
        if (resource == undefined)
            return false;
        else
            this.resources.filter(x => x[0] == type)[0][1] -= amount;
        if (this.resources.filter(x => x[0] == type)[0][1] <= 0) {
            const resourceIndex = this.resources.findIndex(x => x[0] == type);
            this.resources.splice(resourceIndex, 1);
            this.DisplayStoredResources();
            return true;
        }
        this.DisplayStoredResources();
        return true;
    }
    RemoveResourceList(list) {
        let RemovedSuccesfully = true;
        for (let i = 0; i < list.resources.length; i++) {
            if (!this.RemoveResource(list.resources[i][0], list.resources[i][1]))
                RemovedSuccesfully = false;
        }
        return RemovedSuccesfully;
    }
    HasResources(list) {
        for (let i = 0; i < list.resources.length; i++) {
            if (this.GetResourceAmount(list.resources[i][0]) < list.resources[i][1])
                return false;
        }
        return true;
    }
}
class ResourceList {
    resources = [];
    Add(type, amount) {
        const resourceIndex = this.resources.findIndex(x => x[0] == type);
        if (resourceIndex != -1)
            this.resources[resourceIndex][1] += amount;
        else
            this.resources.push([type, amount]);
        return this;
    }
    Remove(type, amount) {
        const resourceIndex = this.resources.findIndex(x => x[0] == type);
        if (resourceIndex != -1)
            this.resources[resourceIndex][1] -= amount;
        else
            console.log("Tried to remove non-existant resource from ResourceList");
        return this;
    }
    GetResourceAmount(type) {
        const resource = this.resources.filter(x => x[0] == type)[0];
        if (resource == undefined)
            return 0;
        return resource[1];
    }
}
//Class for terrain modification
/// <reference path="PixelData.ts" />
class Terrain {
    static ins;
    static perlin;
    mapData = [];
    constructor(Seed) {
        Terrain.perlin = new PerlinNoise(Seed);
        // 16 : 10 resolution | 80x50 pixel map
        for (let i = 0; i < 80; i++) {
            this.mapData[i] = [];
            for (let j = 0; j < 50; j++) {
                this.mapData[i][j] = PerlinPixel(i, j);
            }
        }
    }
    /**
     * Inserts a pixel at the given position
     * @param {number} x
     * @param {number} y
     * @param {PixelData} PixelData
     */
    ModifyMapData(x, y, PixelData) {
        this.mapData[x][y] = PixelData;
    }
    //returns the width of the map in number of objects
    MapX() {
        return this.mapData.length;
    }
    //returns the height of the map in number of objects
    MapY() {
        return this.mapData[0].length;
    }
    IterateMap(callback) {
        for (let i = 0; i < this.mapData.length; i++) {
            for (let j = 0; j < this.mapData[0].length; j++) {
                callback(this.mapData[i][j], i, j);
            }
        }
    }
    /**
     *
     * @param {Array<Array<PixelData>>} NewMapData
     * @returns
     */
    InsertMapDataRaw(NewMapData) {
        if (this.mapData.length != NewMapData.length || this.mapData[0].length != NewMapData[0].length) {
            console.error('Map size is not matched');
            return;
        }
        this.mapData = NewMapData;
    }
    /**
     * Inserts a interactable pixel at the pixel inner position
     * @param {InteractData} Pixel
     */
    InsertResourcePixel(Pixel) {
        this.ModifyMapData(Pixel.x, Pixel.y, Pixel);
        ResourceTerrain.Add(Pixel.ResourceType, 1);
    }
    /**
     * Deletes the interactable pixel at the given X,Y position
     * @param {number} pX
     * @param {number} pY
     * @throws {ReferenceError} No interactable type at that location
     */
    DeleteResourcePixel(pX, pY, replacement) {
        ResourceTerrain.Remove(this.mapData[pX][pY].ResourceType, 1);
        this.ModifyMapData(pX, pY, replacement);
    }
    /**
     * Clears the map and fills it with perlin noise
     */
    Clear() {
        this.IterateMap((pixel, x, y) => {
            pixel = PerlinPixel(x, y);
        });
    }
    /**
     * Hadles safe player movement
     * @param {PlayerData} Player
     * @param {Number} x
     * @param {Number} y
     */
    MovePlayer(Player) {
        //if player is not building allow diagonal movement else only move non-diagonaly
        if (!isBuilding) {
            this.MovePlayerRaw(Player, MovementVector.x, 0);
            this.MovePlayerRaw(Player, 0, MovementVector.y);
        }
        else {
            if (MovementVector.x != 0)
                MovementVector.y = 0;
            this.MovePlayerRaw(Player, MovementVector.x, MovementVector.y);
        }
    }
    /**
     * Moves the given player by the X and Y amount
     * @param {PlayerData} Player
     * @param {Number} x
     * @param {Number} y
     */
    MovePlayerRaw(Player, x, y) {
        let mPixel = this.mapData[Player.x + x][Player.y + y];
        //check if the player can move to the given position
        if (mPixel.status == PixelStatus.walkable) {
            //if is player exiting a door, lock it
            if (mPixel instanceof DoorData)
                mPixel.Close();
            this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
            Player.x += x;
            Player.y += y;
            Player.OverlapPixel = this.mapData[Player.x][Player.y];
            this.ModifyMapData(Player.x, Player.y, new PlayerData(Player.color, Player.HighlightColor, Player.x, Player.y, Player.Health));
        }
        else if (mPixel.status == PixelStatus.interact && mPixel instanceof DoorData) {
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
        Player.OverlapPixel = this.mapData[Player.x][Player.y];
        this.ModifyMapData(Player.x, Player.y, new PlayerData(Player.color, Player.HighlightColor, Player.x, Player.y, Player.Health));
    }
    /**
     * Tries to generate a random resource on the map
     */
    GenerateRandomResource() {
        let rand = Math.random();
        const spawnArea = 12;
        let centerVec = {
            x: Math.floor(this.mapData.length / 2),
            y: Math.floor(this.mapData[0].length / 2),
        };
        let pX;
        let pY;
        //gets a position outside of spawn area
        do {
            pX = Math.floor((Math.random() * this.mapData.length - 2) + 1);
            pY = Math.floor((Math.random() * this.mapData[0].length - 2) + 1);
        } while (((pX > centerVec.x - spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y - spawnArea && pY < centerVec.y + spawnArea)));
        if (rand < (ResourceTerrain.GetResourceAmount(ResourceTypes.wood) / ResourceTerrain.GetResourceAmount(ResourceTypes.stone)) / 3)
            this.GenerateStone(pX, pY);
        else
            this.GenerateTree(pX, pY);
    }
    GenerateRandomStructures(count, RandomGenerator) {
        for (let i = 0; i < count; i++) {
            let rand = RandomGenerator();
            const spawnArea = 12;
            let centerVec = {
                x: Math.floor(this.mapData.length / 2),
                y: Math.floor(this.mapData[0].length / 2),
            };
            let pX;
            let pY;
            //gets a position outside of spawn area
            do {
                pX = Math.floor((RandomGenerator() * this.mapData.length - 2) + 1);
                pY = Math.floor((RandomGenerator() * this.mapData[0].length - 2) + 1);
            } while (((pX > centerVec.x - spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y - spawnArea && pY < centerVec.y + spawnArea))
                && !this.CheckBuildSpace(pX, pY, 5, 5));
            this.GenerateHouse(pX, pY, RandomGenerator);
        }
    }
    /**
     * Generates a tree at the given position (mainly for internal use)
     * @param {number} x
     * @param {number} y
     */
    GenerateTree(x, y) {
        if (ResourceTerrain.GetResourceAmount(ResourceTypes.wood) + 5 > MaxTResource.GetResourceAmount(ResourceTypes.wood))
            return;
        //check if there is a space for the tree in a 3x3 grid
        if (this.CheckGridSpace(x, y, 3) == false)
            return;
        this.InsertResourcePixel(this.GenerateTreePixel(x, y, true));
        this.InsertResourcePixel(this.GenerateTreePixel(x + 1, y, false));
        this.InsertResourcePixel(this.GenerateTreePixel(x - 1, y, false));
        this.InsertResourcePixel(this.GenerateTreePixel(x, y + 1, false));
        this.InsertResourcePixel(this.GenerateTreePixel(x, y - 1, false));
    }
    GenerateTreePixel(x, y, isLog) {
        if (isLog) {
            const OnBreak = () => { ResourceManager.ins.AddResource(ResourceTypes.wood, Math.floor(1 + Math.random() * 10)); }; // 1 - 10
            return new ResourceData(new rgb(200, 70, 50), PixelStatus.breakable, 6, x, y, HighlightPixel.border, ResourceTypes.wood, "w", this.mapData[x][y], OnBreak);
        }
        else {
            const OnBreak = () => { ResourceManager.ins.AddResource(ResourceTypes.wood, Math.floor(Math.random() * 1.85)); }; // 0 - 1
            return new ResourceData(new rgb(49, 87, 44), PixelStatus.breakable, 2, x, y, HighlightPixel.border, ResourceTypes.wood, "l", this.mapData[x][y], OnBreak);
        }
    }
    /**
     * Generates a stone at the given position (mainly for internal use)
     * @param {number} x
     * @param {number} y
     */
    GenerateStone(x, y) {
        if (ResourceTerrain.GetResourceAmount(ResourceTypes.stone) + 5 > MaxTResource.GetResourceAmount(ResourceTypes.stone))
            return;
        //check if stone can freely spawn in a 3x3 grid
        if (this.CheckGridSpace(x, y, 3) == false)
            return;
        this.InsertResourcePixel(this.GenerateStonePixel(x, y));
        this.InsertResourcePixel(this.GenerateStonePixel(x + 1, y));
        this.InsertResourcePixel(this.GenerateStonePixel(x - 1, y));
        this.InsertResourcePixel(this.GenerateStonePixel(x, y + 1));
        this.InsertResourcePixel(this.GenerateStonePixel(x, y - 1));
        let stoneVec = { x: 1, y: 1 };
        let repeats = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < repeats; i++) {
            stoneVec.x = Math.floor(Math.random() * 2) - 1;
            stoneVec.y = Math.floor(Math.random() * 2) - 1;
            if (stoneVec.x == 0)
                stoneVec.x = 1;
            if (stoneVec.y == 0)
                stoneVec.y = 1;
            //prevents spawning two resources in the same space
            if (this.mapData[x + stoneVec.x][y + stoneVec.y] instanceof ResourceData)
                continue;
            this.InsertResourcePixel(this.GenerateStonePixel(x + stoneVec.x, y + stoneVec.y));
        }
    }
    GenerateStonePixel(x, y, isIron = null) {
        let ironChance = Math.floor(1 + Math.random() * 5); // 1 - 5
        if (isIron != null)
            ironChance = isIron ? 1 : 0;
        if (ironChance == 1) {
            //Generate iron
            const OnBreak = () => { ResourceManager.ins.AddResource(ResourceTypes.iron_ore, Math.floor(1 + Math.random() * 3)); }; // 1 - 3
            return new ResourceData(new rgb(221, 161, 94), PixelStatus.breakable, 9, x, y, HighlightPixel.border, ResourceTypes.stone, "i", this.mapData[x][y], OnBreak);
        }
        else {
            //Generate stone
            const OnBreak = () => { ResourceManager.ins.AddResource(ResourceTypes.stone, Math.floor(1 + Math.random() * 5)); }; // 1 - 5
            return new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, x, y, HighlightPixel.border, ResourceTypes.stone, "s", this.mapData[x][y], OnBreak);
        }
    }
    CheckGridSpace(x, y, size) {
        if (size % 2 == 0)
            size++;
        for (let i = x - Math.floor(size / 2); i <= x + Math.floor(size / 2); i++) {
            if (i < 0 || i > this.mapData.length)
                return false;
            for (let j = y - Math.floor(size / 2); j <= y + Math.floor(size / 2); j++) {
                if (j < 0 || j > this.mapData[0].length || this.mapData[i][j].status != PixelStatus.walkable)
                    return false;
            }
        }
        return true;
    }
    CheckBuildSpace(x, y, sizeX, sizeY) {
        for (let i = x; i < x + sizeX; i++) {
            for (let j = y; j < y + sizeY; j++) {
                if (i < 0 || i > this.mapData.length || j < 0 || j > this.mapData[0].length || this.mapData[i][j].status != PixelStatus.walkable)
                    return false;
            }
        }
        return true;
    }
    GenerateHouse(x, y, RandomGenerator) {
        //array of IDs:
        //0 - ground
        //1 - wall
        //2 - floor
        //3 - door
        //4 - window
        //5 - light
        const house = [
            [1, 1, 1, 4, 0],
            [1, 2, 2, 2, 4],
            [1, 2, 5, 2, 4],
            [1, 2, 2, 2, 1],
            [1, 1, 1, 3, 1],
        ];
        let HouseBlocks = new Map();
        HouseBlocks.set(1, FindBuilding("Stone Wall"));
        HouseBlocks.set(2, FindBuilding("Wooden Floor"));
        HouseBlocks.set(3, FindBuilding("Wooden Door"));
        HouseBlocks.set(4, FindBuilding("Glass"));
        HouseBlocks.set(5, FindBuilding("Lantern"));
        for (let i = 0; i < house.length; i++) {
            for (let j = 0; j < house[0].length; j++) {
                if (RandomGenerator() < 0.3)
                    continue;
                if (x + j < 0 || x + j >= this.MapX() || y + i < 0 || y + i >= this.MapY())
                    continue;
                let pixel = nullPixel;
                if (HouseBlocks.has(house[i][j]))
                    pixel = HouseBlocks.get(house[i][j]).at(x + j, y + i);
                else
                    pixel = PerlinPixel(x + j, y + i);
                this.ModifyMapData(x + j, y + i, pixel);
            }
        }
    }
}
/// <reference path="PixelData.ts" />
/// <reference path="Lighting.ts" />
/// <reference path="Resources.ts" />
/// <reference path="Terrain.ts" />
let buildButtons = document.getElementsByClassName("Selection-Button-Div")[0].querySelectorAll("button");
const BuildType = {
    Wall: 0,
    Floor: 1,
};
let Building = [
    {
        build: new BuildingData("Cheap Wall", new rgb(244, 211, 94), PixelStatus.breakable, 3, 1, 1, HighlightPixel.border),
        cost: new ResourceList().Add(ResourceTypes.wood, 3),
        label: "Cheap but weak"
    },
    {
        build: new BuildingData("Wooden Wall", new rgb(127, 79, 36), PixelStatus.breakable, 9, 1, 1, HighlightPixel.border),
        cost: new ResourceList().Add(ResourceTypes.wood, 10),
        label: "Stronger but more expensive"
    },
    {
        build: new BuildingData("Stone Wall", new rgb(85, 85, 85), PixelStatus.breakable, 16, 1, 1, HighlightPixel.border),
        cost: new ResourceList().Add(ResourceTypes.wood, 2).Add(ResourceTypes.stone, 15),
        label: "Strong but expensive"
    },
    {
        build: new BuildingData("Cheap Floor", new rgb(255, 243, 176), PixelStatus.walkable, 3, 1, 1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.wood, 1),
        label: "Not the prettiest"
    },
    {
        build: new BuildingData("Wooden Floor", new rgb(175, 164, 126), PixelStatus.walkable, 3, 1, 1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.wood, 2),
        label: "Decent looking"
    },
    {
        build: new BuildingData("Stone Floor", new rgb(206, 212, 218), PixelStatus.walkable, 3, 1, 1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.stone, 15),
        label: "Build with unforseen quality"
    },
    {
        build: new DoorData("Cheap Door", new rgb(255, 231, 230), 1, 1, 3),
        cost: new ResourceList().Add(ResourceTypes.wood, 10),
        label: "Gets you thru the night"
    },
    {
        build: new DoorData("Wooden Door", new rgb(200, 180, 166), 1, 1, 12),
        cost: new ResourceList().Add(ResourceTypes.wood, 20),
        label: "Feels like home"
    },
    {
        build: new DoorData("Stone Door", new rgb(200, 200, 200), 1, 1, 24),
        cost: new ResourceList().Add(ResourceTypes.wood, 2).Add(ResourceTypes.stone, 25),
        label: "A door that will last"
    },
    {
        build: new LightData("Torch", new rgb(200, 185, 0), 1, 1, 4, 5, 5),
        cost: new ResourceList().Add(ResourceTypes.wood, 10).Add(ResourceTypes.stone, 2),
        label: "Lights up the night, burns out by sunrise"
    },
    {
        build: new LightData("Lantern", new rgb(255, 255, 0), 1, 1, 6, 7, 7),
        cost: new ResourceList().Add(ResourceTypes.wood, 30).Add(ResourceTypes.stone, 7),
        label: "Lasts a lifetime!"
    },
    {
        build: new BuildingData("Landfill", new rgb(109, 76, 65), PixelStatus.walkable, 3, 1, 1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.wood, 10).Add(ResourceTypes.stone, 1),
        label: "Fills the ocean!"
    },
    {
        build: new GlassData("Glass", new rgb(178, 190, 195), 1, 1, 3),
        cost: new ResourceList().Add(ResourceTypes.wood, 4).Add(ResourceTypes.glass, 20),
        label: "Lets the sunlight thru"
    },
    {
        build: new BuildingData("Furnace", new rgb(253, 203, 110), PixelStatus.breakable, 20, 1, 1, HighlightPixel.thickBorder, new rgb(45, 52, 54)),
        cost: new ResourceList().Add(ResourceTypes.wood, 25).Add(ResourceTypes.stone, 60),
        label: "Smelts stuff"
    },
    {
        build: new BuildingData("Large Furnace", new rgb(214, 48, 49), PixelStatus.breakable, 30, 1, 1, HighlightPixel.thickBorder, new rgb(20, 20, 20)),
        cost: new ResourceList().Add(ResourceTypes.wood, 60).Add(ResourceTypes.stone, 105).Add(ResourceTypes.iron, 7).Add(ResourceTypes.glass, 10),
        label: "Smelts but better!"
    }
];
function FindBuilding(buildingName) {
    const find = Building.find(x => x.build.name == buildingName)?.build;
    if (find == undefined)
        throw new Error("Building not found. Provided name: " + buildingName);
    return find;
}
let SelectedBuilding = Building[0];
document.getElementById("Selected-Building-Label").innerHTML = SelectedBuilding.build.name + " - " + SelectedBuilding.label;
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
    ResourceManager.ins.DisplayCostResources(SelectedBuilding.cost);
}
function canPlaceBuildingOn(pixel) {
    //cannot place floor on floor
    if (pixel instanceof BuildingData && pixel.status == PixelStatus.walkable) {
        if (SelectedBuilding.build.name == "Landfill")
            return true;
        if (SelectedBuilding.build.status == PixelStatus.walkable)
            return false;
    }
    if (Player.OverlapPixel.status == PixelStatus.walkable)
        return true;
    return false;
}
function Build(BuildedBuilding) {
    if (ResourceManager.ins.HasResources(BuildedBuilding.cost)) {
        //if placing landfill
        if (BuildedBuilding.build.name == "Landfill") {
            BuildLandfill(Player.x, Player.y);
            return;
        }
        //Quest check for building a furnace
        const ActiveQuest = QuestManager.ins.GetActiveQuest();
        if (ActiveQuest instanceof SpecialTriggerQuest) {
            if (ActiveQuest.TriggerID == 1 && BuildedBuilding.build.name == "Furnace")
                QuestManager.ins.UpdateQuestProgress();
        }
        ResourceManager.ins.RemoveResourceList(BuildedBuilding.cost);
        const didBuildIndoors = Player.OverlapPixel.Indoors;
        Player.OverlapPixel = BuildedBuilding.build.at(Player.x, Player.y);
        isBuilding = true;
        //skip indoors check if placing a floor or similiar
        if (BuildedBuilding.build.status == PixelStatus.walkable) {
            Player.OverlapPixel.Indoors = didBuildIndoors;
            return;
        }
        //check if build is enclosed
        GetEnclosedSpacesAround(Player.x, Player.y).forEach((vec) => {
            //Quest check for building enclosed space
            const ActiveQuest = QuestManager.ins.GetActiveQuest();
            if (ActiveQuest instanceof SpecialTriggerQuest) {
                if (ActiveQuest.TriggerID == 0)
                    QuestManager.ins.UpdateQuestProgress();
            }
            fillInterior(vec.x, vec.y);
        });
    }
}
function PlaceBuildingNoCheck(build) {
    Terrain.ins.mapData[build.x][build.y] = build;
}
function BuildLandfill(x, y) {
    let didBuild = false;
    for (let i = 0; i < SidesDir.length; i++) {
        if (x + SidesDir[i].x < 0 || x + SidesDir[i].x >= Terrain.ins.MapX())
            continue;
        if (y + SidesDir[i].y < 0 || y + SidesDir[i].y >= Terrain.ins.MapY())
            continue;
        if (Terrain.ins.mapData[x + SidesDir[i].x][y + SidesDir[i].y] instanceof TerrainData &&
            Terrain.ins.mapData[x + SidesDir[i].x][y + SidesDir[i].y].type == TerrainType.water) {
            const landfill = Building[11].build.at(x + SidesDir[i].x, y + SidesDir[i].y);
            landfill.color.newSlightlyRandom(10);
            Terrain.ins.mapData[x + SidesDir[i].x][y + SidesDir[i].y] = landfill;
            didBuild = true;
        }
    }
    if (didBuild) {
        ResourceManager.ins.RemoveResourceList(Building[11].cost);
    }
}
/**
 * Returns an array of positions that are inside an enclosed space
 * @param x
 * @param y
 */
function GetEnclosedSpacesAround(x, y) {
    function checkEnclosedSpace(x, y) {
        const CheckedPixel = Terrain.ins.mapData[x][y] instanceof EntityData ? Terrain.ins.mapData[x][y].OverlapPixel : Terrain.ins.mapData[x][y];
        if (CheckedPixel.status != PixelStatus.walkable)
            return false;
        const queue = [new Vector2(x, y)];
        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        visited[x][y] = true;
        while (queue.length > 0) {
            const sVec = queue.shift();
            for (const dVec of SidesDir) {
                const nx = sVec.x + dVec.x;
                const ny = sVec.y + dVec.y;
                if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) {
                    return false; // Found border of the map -> not enclosed
                }
                const NextCheckPixel = Terrain.ins.mapData[nx][ny] instanceof PlayerData ? Player.OverlapPixel : Terrain.ins.mapData[nx][ny];
                if (NextCheckPixel.status == PixelStatus.walkable && !visited[nx][ny]) {
                    visited[nx][ny] = true;
                    queue.push(new Vector2(nx, ny));
                }
            }
        }
        return true;
    }
    const rows = Terrain.ins.MapX();
    const cols = Terrain.ins.MapY();
    const EnclosedVectors = [];
    for (const dVec of SidesDir) {
        const nx = x + dVec.x;
        const ny = y + dVec.y;
        if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) {
            continue;
        }
        const CheckedPixel = Terrain.ins.mapData[nx][ny] instanceof EntityData ? Terrain.ins.mapData[nx][ny].OverlapPixel : Terrain.ins.mapData[nx][ny];
        if (CheckedPixel.status == PixelStatus.walkable) {
            if (checkEnclosedSpace(nx, ny)) {
                EnclosedVectors.push(new Vector2(nx, ny));
            }
        }
    }
    return EnclosedVectors;
}
const InteriorFillColor = new rgb(109, 76, 65);
async function fillInterior(x, y) {
    if (Terrain.ins.mapData[x][y].Indoors)
        return;
    if (Terrain.ins.mapData[x][y].status != PixelStatus.walkable)
        return;
    Terrain.ins.mapData[x][y].Indoors = true;
    InteriorFillVisual(x, y);
    await sleep(40);
    for (const dVec of SidesDir) {
        fillInterior(x + dVec.x, y + dVec.y);
    }
    async function InteriorFillVisual(x, y) {
        const OriginalColor = Terrain.ins.mapData[x][y].color.new();
        const FillPixel = Terrain.ins.mapData[x][y] instanceof EntityData ? Terrain.ins.mapData[x][y].OverlapPixel : Terrain.ins.mapData[x][y];
        for (let i = 0; i < 1; i += .1) {
            FillPixel.color = FillPixel.color.Lerp(InteriorFillColor, i);
            await sleep(5);
        }
        await sleep(400);
        for (let i = 0; i < 1; i += .05) {
            FillPixel.color = FillPixel.color.Lerp(OriginalColor, i);
            await sleep(200);
        }
    }
}
function CheckDeleteInterior(x, y) {
    const EnclosedSpaces = GetEnclosedSpacesAround(x, y);
    for (const vec of SidesDir) {
        if (EnclosedSpaces.find((v) => v.x == x + vec.x && v.y == y + vec.y) == undefined) {
            if (x + vec.x < 0 || x + vec.x >= Terrain.ins.mapData.length - 1 || y + vec.y < 0 || y + vec.y > Terrain.ins.mapData[0].length - 1)
                continue;
            deleteInterior(x + vec.x, y + vec.y);
        }
    }
}
function deleteInterior(x, y) {
    let InteriorPixel = Terrain.ins.mapData[x][y] instanceof PlayerData ? Player.OverlapPixel : Terrain.ins.mapData[x][y];
    InteriorPixel = InteriorPixel instanceof EnemyData ? InteriorPixel.OverlapPixel : InteriorPixel;
    if (!InteriorPixel.Indoors)
        return;
    InteriorPixel.Indoors = false;
    let p;
    for (const dVec of SidesDir) {
        if (x + dVec.x < 0 || x + dVec.x >= Terrain.ins.MapX() || y + dVec.y < 0 || y + dVec.y > Terrain.ins.MapY())
            continue;
        p = Terrain.ins.mapData[x + dVec.x][y + dVec.y] instanceof EntityData ? Terrain.ins.mapData[x + dVec.x][y + dVec.y].OverlapPixel : Terrain.ins.mapData[x + dVec.x][y + dVec.y];
        if (p.Indoors) {
            deleteInterior(x + dVec.x, y + dVec.y);
        }
    }
}
var RecipeTriggerType;
(function (RecipeTriggerType) {
    RecipeTriggerType[RecipeTriggerType["AlwaysDisplay"] = 0] = "AlwaysDisplay";
    RecipeTriggerType[RecipeTriggerType["Furnace"] = 1] = "Furnace";
    RecipeTriggerType[RecipeTriggerType["LargeFurnace"] = 2] = "LargeFurnace";
})(RecipeTriggerType || (RecipeTriggerType = {}));
class Recipe {
    constructor(ResourceFrom, ResourceTo, AmountTo, TriggerBlocks) {
        this.ResourceFrom = ResourceFrom;
        this.ResourceTo = [ResourceTo, AmountTo];
        this.TriggerBlocks = TriggerBlocks;
    }
    ResourceFrom;
    ResourceTo;
    TriggerBlocks;
}
const AvalibleRecipes = [];
class RecipeHandler {
    static ins;
    AllRecipes = [
        new Recipe(new ResourceList().Add(ResourceTypes.sand, 3).Add(ResourceTypes.wood, 1), ResourceTypes.glass, 1, RecipeTriggerType.Furnace),
        new Recipe(new ResourceList().Add(ResourceTypes.iron_ore, 3).Add(ResourceTypes.wood, 3), ResourceTypes.iron, 1, RecipeTriggerType.Furnace),
        new Recipe(new ResourceList().Add(ResourceTypes.iron_ore, 10), ResourceTypes.iron, 8, RecipeTriggerType.LargeFurnace),
        new Recipe(new ResourceList().Add(ResourceTypes.sand, 20), ResourceTypes.glass, 10, RecipeTriggerType.LargeFurnace),
    ];
    AvalibleRecipes = [];
    UpdatevAvalibleRecipes() {
        this.AvalibleRecipes = [];
        let UsedFurnaceRecipes = false;
        let UsedLargeFurnaceRecipes = false;
        const PlayerPos = new Vector2(Player.x, Player.y);
        AroundDir.forEach(dir => {
            if (PlayerPos.x + dir.x < 0 || PlayerPos.x + dir.x >= Terrain.ins.MapX()
                || PlayerPos.y + dir.y < 0 || PlayerPos.y + dir.y >= Terrain.ins.MapY())
                return;
            const Tile = Terrain.ins.mapData[PlayerPos.x + dir.x][PlayerPos.y + dir.y];
            if (Tile instanceof BuildingData) {
                if (Tile.name == "Furnace" && !UsedFurnaceRecipes) {
                    this.AvalibleRecipes.push(...this.AllRecipes.filter(x => x.TriggerBlocks == RecipeTriggerType.Furnace));
                    UsedFurnaceRecipes = true;
                }
                if (Tile.name == "Large Furnace" && !UsedLargeFurnaceRecipes) {
                    this.AvalibleRecipes.push(...this.AllRecipes.filter(x => x.TriggerBlocks == RecipeTriggerType.LargeFurnace));
                    UsedLargeFurnaceRecipes = true;
                }
            }
        });
        this.AvalibleRecipes.push(...this.AllRecipes.filter(x => x.TriggerBlocks == RecipeTriggerType.AlwaysDisplay));
        this.DisplayAvalibleRecipes();
    }
    DisplayAvalibleRecipes() {
        //return;
        const RecipeElements = [];
        this.AvalibleRecipes.forEach(recipe => {
            const button = document.createElement('button');
            if (ResourceManager.ins.HasResources(recipe.ResourceFrom)) {
                const PosInArray = this.AllRecipes.indexOf(recipe);
                button.onclick = () => this.Craft(PosInArray);
            }
            else {
                button.id = "unavailable";
            }
            let ChildrenOfElement = [];
            let WorkedElement;
            const DivResourceFrom = document.createElement('div');
            DivResourceFrom.classList.add("Ingredients-List");
            recipe.ResourceFrom.resources.forEach((resource) => {
                WorkedElement = document.createElement('p');
                WorkedElement.innerHTML = resource[1].toString();
                ChildrenOfElement.push(WorkedElement);
                WorkedElement = document.createElement('img');
                WorkedElement.src = "../Icons/" + ResourceTypes[resource[0]] + ".png";
                ChildrenOfElement.push(WorkedElement);
            });
            DivResourceFrom.replaceChildren(...ChildrenOfElement);
            ChildrenOfElement = [];
            const ArrowElement = document.createElement('img');
            ArrowElement.src = "../Icons/right-arrow.png";
            ArrowElement.classList.add("arrow");
            const DivResourceTo = document.createElement('div');
            DivResourceTo.classList.add("result");
            WorkedElement = document.createElement('p');
            WorkedElement.innerHTML = recipe.ResourceTo[1].toString();
            ChildrenOfElement.push(WorkedElement);
            WorkedElement = document.createElement('img');
            WorkedElement.src = "../Icons/" + ResourceTypes[recipe.ResourceTo[0]] + ".png";
            ChildrenOfElement.push(WorkedElement);
            DivResourceTo.replaceChildren(...ChildrenOfElement);
            ChildrenOfElement = [];
            button.replaceChildren(DivResourceFrom, ArrowElement, DivResourceTo);
            RecipeElements.push(button);
        });
        if (RecipeElements.length == 0)
            document.getElementsByClassName("Crafting-List")[0].replaceChildren(document.createElement('hr'));
        else
            document.getElementsByClassName("Crafting-List")[0].replaceChildren(...RecipeElements);
    }
    Craft(id) {
        const CraftedRecipe = this.AllRecipes[id];
        ResourceManager.ins.RemoveResourceList(CraftedRecipe.ResourceFrom);
        ResourceManager.ins.AddResource(CraftedRecipe.ResourceTo[0], CraftedRecipe.ResourceTo[1]);
        this.DisplayAvalibleRecipes();
    }
}
class EnemyData extends EntityData {
    path = [];
    IsRaidEnemy = GameTime.ins.SpawnRaidEnemies();
    constructor(color, borderColor, x, y, EntityHealth) {
        super(color, PixelStatus.breakable, x, y, borderColor, EntityHealth);
        EnemyList.push(this);
        this.Move(new Vector2(0, 0));
    }
    Die() {
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlapPixel);
        EnemyList = EnemyList.filter(e => e != this);
        //drop resources
        const dropAmount = Math.floor(Math.random() * 2) + 1;
        ResourceManager.ins.AddResource(ResourceTypes.human_meat, dropAmount);
    }
    Despawn() {
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlapPixel);
        EnemyList = EnemyList.filter(e => e != this);
    }
    MoveToPlayer() {
        if (Player.OverlapPixel.Indoors && !this.IsRaidEnemy) {
            //move a random direction half the time
            if (Math.random() < 0.5)
                return;
            const dir = AroundDir[Math.floor(Math.random() * AroundDir.length)];
            this.Move(dir);
            return;
        }
        //Generate path if needed or when the player is too far from the end point
        if (this.path == null || (this.path != null && this.path.length <= 1)
            || Math.abs(this.path[this.path.length - 1].x - Player.x) + Math.abs(this.path[this.path.length - 1].y - Player.y) > this.path.length - 4) {
            this.path = Pathfinding.aStar(new PathfindingNode(this.x, this.y), new PathfindingNode(Player.x, Player.y), this.IsRaidEnemy);
        }
        if (this.path == null) {
            //move a random direction half the time
            if (Math.random() < 0.5)
                return;
            const dir = AroundDir[Math.floor(Math.random() * AroundDir.length)];
            this.Move(dir);
            return;
        }
        /* DEBUG: Shows path on map
        this.path.forEach(element => {
            Renderer.ins.DrawGizmoLine(new Vector2(element.x, element.y), new Vector2(element.x + 1, element.y + 1));
        });*/
        this.Move(new Vector2(this.path[1].x - this.x, this.path[1].y - this.y));
        try {
            if (Terrain.ins.mapData[this.path[0].x][this.path[0].y].status == PixelStatus.walkable)
                this.path.shift();
        }
        catch (e) {
            this.path = null;
        }
    }
    Move(dir) {
        if (this.x + dir.x < 0 || this.x + dir.x >= Terrain.ins.MapX() || this.y + dir.y < 0 || this.y + dir.y >= Terrain.ins.MapY())
            return;
        const moveTile = Terrain.ins.mapData[this.x + dir.x][this.y + dir.y];
        if (moveTile instanceof PlayerData) {
            Player.Damage(1);
            return;
        }
        //if attempting to walk into an unwalkable tile force a path recalculation
        if (moveTile.status != PixelStatus.walkable) {
            if (moveTile instanceof BuildingData && this.IsRaidEnemy) {
                moveTile.Damage(1);
            }
            else {
                this.path = null;
            }
            return;
        }
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlapPixel);
        this.x += dir.x;
        this.y += dir.y;
        this.OverlapPixel = moveTile;
        Terrain.ins.ModifyMapData(this.x, this.y, this);
    }
}
class PathfindingNode {
    gCost;
    hCost;
    fCost;
    parent; // Track the parent node to trace the path
    walkable;
    isBuilding;
    x;
    y;
    constructor(x, y, walkable = true, isBuilding = false) {
        this.walkable = walkable;
        this.isBuilding = isBuilding;
        this.x = x;
        this.y = y;
        this.gCost = 0;
        this.hCost = 0;
        this.fCost = 0;
        this.parent = null;
    }
    calculateFCost() {
        this.fCost = this.gCost + this.hCost;
    }
}
class Pathfinding {
    constructor() { }
    static getHeuristic(nodeA, nodeB) {
        //skip if the building is too strong
        let ObstaclePenalty = 0;
        const PixelDataAtB = Terrain.ins.mapData[nodeB.x][nodeB.y];
        if (PixelDataAtB instanceof BuildingData)
            ObstaclePenalty = PixelDataAtB.Health;
        return (Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y)) + ObstaclePenalty;
    }
    static aStar(startNode, endNode, PathThruBuildings) {
        let openSet = [];
        let closedSet = new Set();
        openSet.push(startNode);
        while (openSet.length > 0) {
            // Get the node with the lowest fCost
            let currentNode = openSet.reduce((prev, curr) => (prev.fCost < curr.fCost ? prev : curr));
            if (this.IsSameNode(currentNode, endNode)) {
                // Reconstruct and return the best path using the parent nodes
                return this.retracePath(currentNode);
            }
            openSet = openSet.filter(node => !this.IsSameNode(node, currentNode));
            closedSet.add(currentNode);
            for (let neighbor of this.getNeighbors(currentNode)) {
                //check for any path even with buildings
                if (PathThruBuildings &&
                    (neighbor.walkable || neighbor.isBuilding)) {
                    if (this.IsInSet(neighbor, closedSet))
                        continue;
                } //check for free path without buildings
                else if ((!neighbor.walkable && (neighbor.x != Player.x || neighbor.y != Player.y)) || this.IsInSet(neighbor, closedSet)) {
                    continue;
                }
                let newMovementCostToNeighbor = currentNode.gCost + Pathfinding.getHeuristic(currentNode, neighbor);
                if (newMovementCostToNeighbor < neighbor.gCost || !this.IsInSet(neighbor, openSet)) {
                    neighbor.gCost = newMovementCostToNeighbor;
                    neighbor.hCost = Pathfinding.getHeuristic(neighbor, endNode);
                    neighbor.calculateFCost();
                    neighbor.parent = currentNode; // Set the parent to trace the path
                    if (!this.IsInSet(neighbor, openSet)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        // If no path is found, return null
        return null;
    }
    // Function to retrace the path from the end node to the start node
    static retracePath(endNode) {
        let path = [];
        let currentNode = endNode;
        while (currentNode !== null) {
            path.push({ x: currentNode.x, y: currentNode.y });
            currentNode = currentNode.parent; // Move to the parent node
        }
        return path.reverse(); // Reverse the path to start from the startNode
    }
    // Function to get the neighbors of a node
    static getNeighbors(node) {
        const neighbors = [];
        for (let dir of AroundDir) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            if (newX >= 0 && newX < Terrain.ins.MapX() && newY >= 0 && newY < Terrain.ins.MapY()) {
                const cell = new PathfindingNode(newX, newY, Terrain.ins.mapData[newX][newY].status == PixelStatus.walkable, Terrain.ins.mapData[newX][newY] instanceof BuildingData);
                neighbors.push(cell);
            }
        }
        return neighbors;
    }
    static IsSameNode(nodeA, nodeB) {
        return nodeA.x === nodeB.x && nodeA.y === nodeB.y;
    }
    static IsInSet(node, set) {
        for (let setNode of set) {
            if (this.IsSameNode(node, setNode)) {
                return true;
            }
        }
        return false;
    }
}
/// <reference path="SupportClasses.ts" />
let MovementVector = new Vector2(0, 0);
let usedInput = false;
let inputPresses = [];
let removeInputValues = [];
//calls repeatedly on key hold
function onKeyDown(event) {
    switch (event.code) {
        case "KeyW": //W
            if (MovementVector.y != -1) {
                MovementVector.y = -1;
                usedInput = false;
            }
            break;
        case "KeyA": //A
            if (MovementVector.x != -1) {
                MovementVector.x = -1;
                usedInput = false;
            }
            break;
        case "KeyS": //S
            if (MovementVector.y != 1) {
                MovementVector.y = 1;
                usedInput = false;
            }
            break;
        case "KeyD": //D
            if (MovementVector.x != 1) {
                MovementVector.x = 1;
                usedInput = false;
            }
            break;
        default:
            //for other keys add to input presses array
            if (!inputPresses.includes(event.code)) {
                inputPresses.push(event.code);
                usedInput = false;
            }
            break;
    }
    CheckInputPos();
}
let clearMap = { xMinus: false, xPlus: false, yMinus: false, yPlus: false };
//calls once on key release
function onKeyUp(event) {
    //clear movement vector if it was registered ingame
    if (usedInput) {
        switch (event.code) {
            case "KeyW":
                if (MovementVector.y == -1)
                    MovementVector.y = 0;
                break;
            case "KeyD":
                if (MovementVector.x == 1)
                    MovementVector.x = 0;
                break;
            case "KeyS":
                if (MovementVector.y == 1)
                    MovementVector.y = 0;
                break;
            case "KeyA":
                if (MovementVector.x == -1)
                    MovementVector.x = 0;
                break;
            default:
                if (inputPresses.includes(event.code))
                    inputPresses.splice(inputPresses.indexOf(event.code), 1);
                break;
        }
        return;
    }
    //if the key was not registered ingame, designate for later removal
    switch (event.code) {
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
    CheckInputPos();
}
function CheckInputPos() {
    //check if player is trying to move out of bounds
    if (Player.x + MovementVector.x < 0 || Player.x + MovementVector.x >= Terrain.ins.MapX())
        MovementVector.x = 0;
    if (Player.y + MovementVector.y < 0 || Player.y + MovementVector.y >= Terrain.ins.MapY())
        MovementVector.y = 0;
}
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);
//returns a function that generates a random number between 0 and 1 exclusive using a seed
function RandomUsingSeed(seed) {
    const m = 0x80000000; // 2**31
    const a = 1103515245;
    const c = 12345;
    let state = seed;
    //returns a random number between 0 and 1 (not including 1)
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
        //ocean <1 - 0.7)
        let t = (value - 0.7) / 0.3; //from 0.7 - 1 to 0 - 1
        if (value > 0.7)
            return {
                r: this.lerp(11, 4, t),
                g: this.lerp(89, 60, t),
                b: this.lerp(214, 201, t),
                s: PixelStatus.block,
                t: TerrainType.water
            };
        //sand <0.7 - 0.62)
        t = (value - 0.62) / 0.08; //from 0.62 - 0.7 to 0 - 1
        if (value > 0.62)
            return {
                r: this.lerp(232, 204, t),
                g: this.lerp(217, 191, t),
                b: this.lerp(12, 8, t),
                s: PixelStatus.walkable,
                t: TerrainType.sand
            };
        //grass <0.62 - 0>
        t = (value - 0) / 0.62; //from 0 - 0.62 to 0 - 1
        return {
            r: this.lerp(22, 42, t),
            g: this.lerp(153, 176, t),
            b: this.lerp(5, 25, t),
            s: PixelStatus.walkable,
            t: TerrainType.ground
        };
    }
    pixel(x, y) {
        return this.perlinColorTerrain(x, y);
    }
}
class Quest {
    constructor(questID, questRequirement, numberOfSteps) {
        this.questXP = questID;
        this.questRequirement = questRequirement;
        this.questRequirementStepsMax = numberOfSteps;
    }
    questXP;
    questRequirement;
    questRequirementStep = 0;
    questRequirementStepsMax;
    static GetQuests() {
        return [
            new ResourceQuest(2, "Gather 10 wood", 10, ResourceTypes.wood),
            new ResourceQuest(2, "Gather 5 stone", 5, ResourceTypes.stone),
            new SpecialTriggerQuest(5, "Build an inclosed space", 1, 0),
            new SpecialTriggerQuest(4, "Build a furnace", 1, 1),
            new ResourceQuest(4, "Smelt 10 glass", 10, ResourceTypes.glass),
            new ResourceQuest(4, "Gather 12 iron ore", 12, ResourceTypes.iron_ore),
            new ResourceQuest(5, "Smelt 4 iron", 4, ResourceTypes.iron),
        ];
    }
}
class ResourceQuest extends Quest {
    constructor(questID, questRequirement, numberOfSteps, resourceType) {
        super(questID, questRequirement, numberOfSteps);
        this.resourceType = resourceType;
    }
    resourceType;
    CheckCompleteQuest(ResourceType, amount) {
        if (this.resourceType == ResourceType) {
            QuestManager.ins.UpdateQuestProgress(amount);
        }
    }
}
class RandomResourceQuest extends ResourceQuest {
    constructor(QuestID) {
        //picks a random resource type
        const hexEncoded = [...worldName].map(char => char.charCodeAt(0).toString(16)).join('');
        const nameSeed = parseInt(hexEncoded, 16);
        const rnd = RandomUsingSeed(QuestID * nameSeed);
        const enumValues = Object.values(ResourceTypes).filter(value => typeof value === "number");
        const PickedResourceIndex = Math.floor(rnd() * enumValues.length);
        const resourceType = enumValues[PickedResourceIndex];
        const numberOfSteps = Math.floor(rnd() * 30 + (enumValues.length - PickedResourceIndex));
        const questRequirement = `Gather ${numberOfSteps} ${ResourceTypes[resourceType].replace("_", " ")}`;
        super(QuestManager.GetXPRewardFromRandomQuest(QuestID, numberOfSteps, (0.7 + (PickedResourceIndex / enumValues.length))), questRequirement, numberOfSteps, resourceType);
    }
}
class SpecialTriggerQuest extends Quest {
    TriggerID;
    constructor(questID, questRequirement, numberOfSteps, TriggerID) {
        super(questID, questRequirement, numberOfSteps);
        this.TriggerID = TriggerID;
    }
}
class QuestManager {
    static ins;
    static PlayerLevel = 1;
    static PlayerXP = 0;
    static PlayerXpToNextLevel = Math.floor(Math.log(QuestManager.PlayerLevel + 3) * 10);
    activeQuestId = 0;
    quests = Quest.GetQuests();
    activeQuest = null;
    GetActiveQuest() {
        if (this.activeQuest != null && this.activeQuest.questRequirementStep < this.activeQuest.questRequirementStepsMax)
            return this.activeQuest;
        if (this.activeQuestId >= this.quests.length)
            this.activeQuest = new RandomResourceQuest(this.activeQuestId);
        else
            this.activeQuest = this.quests[this.activeQuestId];
        return this.activeQuest;
    }
    async UpdateQuestProgress(progress) {
        if (progress == undefined)
            progress = 1;
        const currentQuest = this.GetActiveQuest();
        if (currentQuest == null)
            return;
        currentQuest.questRequirementStep = Math.min(progress + currentQuest.questRequirementStep, currentQuest.questRequirementStepsMax);
        document.getElementById("Quest-Completion").innerText = currentQuest.questRequirementStep + "/" + currentQuest.questRequirementStepsMax;
        if (currentQuest.questRequirementStep >= currentQuest.questRequirementStepsMax) {
            const waitTime = this.activeQuestId == 0 ? 0 : 500;
            await new Promise(r => setTimeout(r, waitTime));
            //quest completed
            QuestManager.PlayerXP += currentQuest.questXP;
            this.activeQuestId++;
            this.UpdateDisplayQuest();
            while (QuestManager.PlayerXP >= QuestManager.PlayerXpToNextLevel) {
                this.UpdateLevelDisplay();
                await new Promise(r => setTimeout(r, 500));
                QuestManager.PlayerXP -= QuestManager.PlayerXpToNextLevel;
                QuestManager.PlayerXpToNextLevel = Math.floor(Math.log(QuestManager.PlayerLevel + 3) * 10);
                QuestManager.PlayerLevel++;
            }
        }
        this.UpdateDisplayQuest();
        this.UpdateLevelDisplay();
    }
    UpdateDisplayQuest() {
        const currentQuest = this.GetActiveQuest();
        if (currentQuest != null) {
            document.getElementById("Quest-XP").innerText = currentQuest.questXP.toString() + "xp";
            document.getElementById("Quest-Description").innerText = currentQuest.questRequirement;
            document.getElementById("Quest-Completion").innerText = currentQuest.questRequirementStep + "/" + currentQuest.questRequirementStepsMax;
        }
        else {
            document.getElementById("Quest-XP").innerText = "";
            document.getElementById("Quest-Description").innerText = "No active quests";
            document.getElementById("Quest-Completion").innerText = "";
        }
    }
    UpdateLevelDisplay() {
        document.getElementById("Player-Level").innerText = "Level: " + QuestManager.PlayerLevel;
        document.getElementById("Player-XPLevel").innerText = QuestManager.PlayerXP + "/" + QuestManager.PlayerXpToNextLevel + "xp";
    }
    static GetXPRewardFromRandomQuest(id, ResourceCount, XpMultiplier) {
        return Math.floor(Math.floor(ResourceCount / 3.5) * XpMultiplier + (id * 0.33));
    }
}
//Class for rendering the game
class Renderer {
    static ins;
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
        window.addEventListener('resize', this.UpdateWindowSize);
        this.UpdateWindowSize();
    }
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        ctx.beginPath(); //Clear ctx from prev. frame
        Terrain.ins.IterateMap((pixel, x, y) => {
            if (!(pixel instanceof GlassData))
                ctx.fillStyle = pixel.color.getWithLight(pixel.Brightness);
            else
                ctx.fillStyle = pixel.OverlaidPixel.color.MixWith(pixel.color, 0.4).getWithLight(pixel.Brightness);
            ctx.fillRect(x * canvasScale, y * canvasScale, canvasScale, canvasScale);
        });
        this.DrawInteractIndicator();
        ctx.strokeStyle = Player.HighlightColor.getWithLight(Math.max(0.35, Terrain.ins.mapData[Player.x][Player.y].Brightness));
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x * canvasScale + 1, Player.y * canvasScale + 1, canvasScale - 2, canvasScale - 2);
        if (this.LineGizmos.length != 0) {
            ctx.beginPath();
            this.LineGizmos.forEach(element => {
                ctx.moveTo(element[0].x, element[0].y);
                ctx.lineTo(element[1].x, element[1].y);
            });
            ctx.stroke();
            this.LineGizmos = [];
        }
        //override the canvas if player is dead
        if (Player.respawnTime > 0) {
            this.DrawDeathScreen(1 - Player.respawnTime / 5);
            return;
        }
    }
    LineGizmos = [];
    DrawGizmoLine(from, to) {
        this.LineGizmos.push([
            new Vector2(from.x * canvasScale, from.y * canvasScale),
            new Vector2(to.x * canvasScale, to.y * canvasScale)
        ]);
    }
    DrawInteractIndicator() {
        if (canvasScale < 6.5)
            return;
        ctx.beginPath();
        Terrain.ins.IterateMap((pixel, x, y) => {
            if (IsHighlightable(pixel)) {
                switch (pixel.Highlight) {
                    case HighlightPixel.none:
                        break;
                    case HighlightPixel.lightBorder:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * canvasScale, y * canvasScale, canvasScale - 1, canvasScale - 1);
                        break;
                    case HighlightPixel.border:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x * canvasScale + 1, y * canvasScale + 1, canvasScale - 2, canvasScale - 2);
                        break;
                    case HighlightPixel.thickBorder:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 4;
                        ctx.strokeRect(x * canvasScale + 2, y * canvasScale + 2, canvasScale - 4, canvasScale - 4);
                        break;
                    case HighlightPixel.slash:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x * canvasScale + 1, y * canvasScale + 1, canvasScale - 2, canvasScale - 2);
                        ctx.beginPath();
                        ctx.moveTo(x * canvasScale + 1, y * canvasScale + 1);
                        ctx.lineTo(x * canvasScale + canvasScale - 1, y * canvasScale + canvasScale - 1);
                        ctx.stroke();
                        break;
                }
            }
        });
    }
    DrawDeathScreen(t) {
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, Math.min(canvas.height * (t * 3), canvas.height));
        Player.respawnTime -= Math.min((1000 / tickSpeed) / 1000, Player.respawnTime);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `50px Arial`;
        const textString = `You have died!`;
        const textRespawnTimer = `${Player.respawnTime.toFixed(1)}s`;
        let textWidth = ctx.measureText(textString).width;
        ctx.fillText(textString, (canvas.width / 2) - (textWidth / 2), canvas.height / 2 - 35);
        textWidth = ctx.measureText(textRespawnTimer).width;
        ctx.fillText(textRespawnTimer, (canvas.width / 2) - (textWidth / 2), canvas.height / 2 + 35);
    }
    UpdateWindowSize() {
        canvasScale = Math.floor(window.innerWidth / 140);
        if (Terrain.ins.MapY() * canvasScale > window.innerHeight * 0.8)
            canvasScale = Math.floor(window.innerHeight * 0.7 / Terrain.ins.MapY());
        canvas.width = Terrain.ins.MapX() * canvasScale;
        canvas.height = Terrain.ins.MapY() * canvasScale;
    }
}
function Save() {
    console.log("Saving wolrd " + worldName);
    let save_resources = "";
    for (const key of Object.values(ResourceTypes)) {
        if (!isNaN(Number(key))) {
            const resource_type = key;
            save_resources += key + ":" + ResourceManager.ins.GetResourceAmount(resource_type).toString() + "|";
        }
    }
    save_resources += "\n";
    let save_player_data = QuestManager.PlayerLevel + "|" + QuestManager.PlayerXP +
        "|" + QuestManager.PlayerXpToNextLevel + "|" + QuestManager.ins.activeQuestId + "|" + Player.Health +
        "|" + GameTime.ins.time + "|" + Player.x + "|" + Player.y + "|" + QuestManager.ins.GetActiveQuest().questRequirementStep +
        "|" + GameTime.ins.day + "|\n";
    let wolrd_data = [];
    for (let x = 0; x < Terrain.ins.mapData.length; x++) {
        for (let y = 0; y < Terrain.ins.mapData[x].length; y++) {
            let tile = Terrain.ins.mapData[x][y];
            let tileInfo = "";
            if (tile instanceof ResourceData) {
                tileInfo += tile.ResourceID + "|";
            }
            else if (tile instanceof BuildingData) {
                tileInfo += tile.name;
                if (tile.OverlaidPixel instanceof BuildingData) {
                    tileInfo += "#" + tile.OverlaidPixel.name;
                }
                tileInfo += "|";
            }
            if (tile.Indoors)
                tileInfo += tileInfo === "" ? "|1|" : "1|";
            else if (tileInfo != "")
                tileInfo += "0|";
            if (tileInfo != "") {
                wolrd_data.push(x + "#" + y + "|" + tileInfo);
            }
        }
    }
    // Save the world
    fetch('non-viewable/saveWorld.php', {
        method: 'POST',
        body: JSON.stringify({
            worldName: worldName,
            password: password, // <- unsafe 🥶
            resources: save_resources,
            playerData: save_player_data,
            worldData: wolrd_data,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        },
    }).then(response => {
        if (response.ok) {
            console.log("World saved..");
        }
        else {
            response.text().then(text => { console.error("ERROR WITH SAVING WORLD:\n" + text); });
        }
    });
}
function Load(Resource, PlayerData, WorldData) {
    if (Resource == "" || PlayerData == "")
        return;
    const resourcePair = Resource.split("|");
    for (const pair of resourcePair) {
        const resource = pair.split(":");
        if (resource.length > 1) {
            ResourceManager.ins.AddResourceNoQuest(Number(resource[0]), Number(resource[1]));
        }
    }
    const playerData = PlayerData.split("|");
    QuestManager.PlayerLevel = Number(playerData[0]);
    QuestManager.PlayerXP = Number(playerData[1]);
    QuestManager.PlayerXpToNextLevel = Number(playerData[2]);
    QuestManager.ins.activeQuestId = Number(playerData[3]);
    QuestManager.ins.UpdateQuestProgress(Number(playerData[8]));
    QuestManager.ins.UpdateLevelDisplay();
    Player.SetHP(Number(playerData[4]));
    GameTime.ins.time = Number(playerData[5]);
    Player.OverlapPixel = Terrain.ins.mapData[Number(playerData[6])][Number(playerData[7])];
    Player.x = Number(playerData[6]);
    Player.y = Number(playerData[7]);
    Terrain.ins.MovePlayer(Player); //Draw player
    GameTime.ins.day = Number(playerData[9]);
    GameTime.ins.UpdateDayDisplay();
    WorldData.forEach(element => {
        if (element == false)
            return; //end line
        element = element;
        //load variables
        const coordinates = element.split("|")[0].split("#");
        const x = Number(coordinates[0]);
        const y = Number(coordinates[1]);
        const tileInfo = element.split("|")[1].split("#");
        let tile = "";
        let overlapTile = "";
        const isIndoors = element.split("|")[2] == "1";
        if (tileInfo.length >= 1)
            tile = tileInfo[0];
        if (tileInfo.length >= 2)
            overlapTile = tileInfo[1];
        if (tile.length == 0) { //place nothing, set indoors
            Terrain.ins.mapData[x][y].Indoors = isIndoors;
            return;
        }
        else if (tile.length == 1) { //Place resource
            switch (tile) {
                case "w":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateTreePixel(x, y, true));
                    break;
                case "l":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateTreePixel(x, y, false));
                    break;
                case "s":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateStonePixel(x, y, false));
                    break;
                case "i":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateStonePixel(x, y, true));
                    break;
            }
            return;
        }
        //Place building
        const tileData = FindBuilding(tile).at(x, y);
        if (tileData == null)
            return;
        if (overlapTile != "") {
            const overlapTileData = FindBuilding(overlapTile).at(x, y);
            if (overlapTileData == null)
                return;
            tileData.OverlaidPixel = overlapTileData;
        }
        tileData.Indoors = isIndoors;
        PlaceBuildingNoCheck(tileData);
    });
}
;
function SaveAndExit() {
    Save();
    window.location.href = "../web-files/login.php";
}
/// <reference path="Terrain.ts" />
/// <reference path="Rendering.ts" />
/// <reference path="Lighting.ts" />
//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker").style.display = isMobile ? "block" : "none";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
let canvasScale = 10;
const ResourceTerrain = new ResourceList();
const MaxTResource = new ResourceList().Add(ResourceTypes.wood, 60).Add(ResourceTypes.stone, 55);
let Player;
let EnemyList = [];
function Start() {
    GameTime.ins = new GameTime();
    ResourceManager.ins = new ResourceManager();
    RecipeHandler.ins = new RecipeHandler();
    Terrain.ins = new Terrain(seed);
    //sets player position in the middle of the map
    Player = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 1, 1, 10);
    Renderer.ins = new Renderer();
    QuestManager.ins = new QuestManager();
    Renderer.ins.Draw();
    if (GenerateNewWorld) {
        const numOfBuildings = Math.floor(RandomUsingSeed(seed)() * 2) + 1; // 1-2 buildings
        Terrain.ins.GenerateRandomStructures(numOfBuildings, RandomUsingSeed(seed));
        for (let i = 0; i < 40; i++) {
            Terrain.ins.GenerateRandomResource();
        }
        Player.FindAndSetSpawnPos();
        Terrain.ins.MovePlayer(Player); //Draw player
    }
    ResourceManager.ins.DisplayCostResources(SelectedBuilding.cost);
    Load(resourceSave, playerData, worldData);
    //Save(); //why not ?
}
let isBuilding = false;
let EnemyMovementInterval = 0;
function Update() {
    if (Player.respawnTime <= 0) {
        EnemyMovementInterval++;
        if (EnemyMovementInterval >= 2) {
            EnemyMovementInterval = 0;
            //Enemy movement
            EnemyList.forEach(e => e.MoveToPlayer());
        }
        //placement logic
        isBuilding = false;
        if (inputPresses.includes("KeyE") && canPlaceBuildingOn(Player.OverlapPixel)) {
            Build(SelectedBuilding);
            RecipeHandler.ins.UpdatevAvalibleRecipes();
        }
        //digging underneath player logic
        if (inputPresses.includes("KeyQ")) {
            //if standing on a building damage it
            if (Player.OverlapPixel instanceof BuildingData) {
                const brokePixel = Player.OverlapPixel.DamageNoDestroy(1);
                if (brokePixel) {
                    Player.OverlapPixel = Player.OverlapPixel.OverlaidPixel;
                    //removes the interior if building below player is destroyed
                    CheckDeleteInterior(Player.x, Player.y);
                    RecipeHandler.ins.UpdatevAvalibleRecipes();
                }
            }
            if (Player.OverlapPixel instanceof TerrainData) {
                if (Player.OverlapPixel.type == TerrainType.sand) {
                    if (Math.random() < 0.3)
                        ResourceManager.ins.AddResource(ResourceTypes.sand, 1);
                }
            }
        }
        //movement interactions
        Player.MoveBy(MovementVector.x, MovementVector.y);
        //Resource spawner
        if (Math.random() > 0.98) {
            Terrain.ins.GenerateRandomResource();
        }
    }
    UpdateInput();
    GameTime.ins.Tick();
    Renderer.ins.Draw();
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000 / tickSpeed);
