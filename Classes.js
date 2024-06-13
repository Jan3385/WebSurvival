class rgb{
    /**
     * @constructor
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     */
    constructor(r,g,b){
        this.r = r;
        this.g = g;
        this.b = b;
    }
    new(){
        return new rgb(this.r, this.g, this.b);
    }
    newSlightlyRandom(val){
        return new rgb(this.r + Math.floor(Math.random()*val), 
                        this.g + Math.floor(Math.random()*val), 
                        this.b + Math.floor(Math.random()*val));
    }
    /**
    * Returns the rgb value in string format
    * @returns {string}
    */
    get(){
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
    }
    /**
     * Makes the rgb value darker by the value
     * @param {number} val 
     */
    Darken(val = 1.5){
        this.r /= val;
        this.g /= val;
        this.b /= val;
    }
}

const PixelStatus = {
    free: "free",
    taken: "taken",
    block: "block",
    interact: "interact"
};
class PixelData{
    /**
     * Stores data about the given pixel
     * @param {number} color 
     * @param {PixelStatus} status 
     */
    constructor(color, status = PixelStatus.free){
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
function PerlinPixel(x,y){
    const pColor = Perlin.perlinColorTerrain(x/9,y/9);
    return new PixelData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s);
}
const EmptyPixel = new PixelData(new rgb(147, 200, 0));
class PlayerData extends PixelData{
    /**
     * Creates a player object with the given colors at the given position
     * @param {rgb} color 
     * @param {rgb} borderColor 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(color, borderColor, x, y){
        super(color, PixelStatus.block);
        this.borderColor = borderColor;
        this.x = x;
        this.y = y;
        this.OverlapPixel = PerlinPixel(x, y);
    }
}
const InteractType = {
    stone: 0,
    wood: 1,
    door: 2,
    wall: 3,
    floor: 4,
};
class InteractData extends PixelData{
    /**
     * Construct a interactable pixel with the given color at the given position
     * @param {rgb} color 
     * @param {number} x 
     * @param {number} y 
     * @param {InteractType} type 
     * @param {number} [hp=6]
     */
    constructor(color, x, y, type, hp = 6){
        super(color, PixelStatus.interact);
        this.x = x;
        this.y = y;
        this.interactType = type;
        this.health = hp;
        this.highlight = true;
    }
    /**
     * Damages the interactable pixel, return true if it was destroyed (on final hit)
     * @returns {boolean} 
     */
    Damage(){
        this.health--;
        this.color.Darken(1.2);
        if(this.health <= 0) {
            Terrain.DeleteInteractPixel(this.x, this.y);
            return true;
        }
        return false;
    }
}

class BuildingData extends InteractData{
    /**
     * @constructor
     * @param {rgb} color 
     * @param {number} x 
     * @param {number} y 
     * @param {PixelStatus} walkStatus 
     * @param {number} hp 
     * @param {boolean} highlight
     * @param {InteractType} interactionType
     */
    constructor(color, x, y, walkStatus, hp = 12, highlight = true, interactionType){
        super(color, x, y, interactionType, hp);
        this.maxHealh = hp;
        this.defaultColor = color;
        this.walkStatus = walkStatus
        this.highlight = highlight;
    }
    /**
     * Returns this object at the specified coordinates
     * @param {number} x 
     * @param {number} y 
     * @returns {ThisType}
     */
    at(x,y){
        return new BuildingData(this.defaultColor.newSlightlyRandom(30), x, y, this.walkStatus, this.maxHealh, this.highlight, this.interactType);
    }
    Damage(){
        this.health--;
        this.color.Darken(1.07);
        if(this.health <= 0) {
            Terrain.ModifyMapData(this.x, this.y, PerlinPixel(this.x, this.y));
            return true;
        }
        return false;
    }
    FullyHeal(){
        this.health = this.maxHealh;
        this.color = this.defaultColor;
    }
}
let interactCol = new rgb(60, 60, 60);
//Class for rendering the game
class Renderer{
    /**
     * Creates a renderer object for the canvas
     * @constructor
     */
    constructor(){
        this.init();
        this.Draw();
    }
    /**
     * Initialises the canvas and fills it with perlin noise
     */
    init(){
        if(canvas.width % canvasScale != 0 || canvas.height % canvasScale != 0) 
            console.error('Canvas size is not divisible by scale');

        for (let i = 0; i < canvas.width/canvasScale; i++) {
            mapData[i] = [];
            for (let j = 0; j < canvas.height/canvasScale; j++) {
                mapData[i][j] = PerlinPixel(i, j); 
            }
        }
        console.log("initialised zanvas with array of X:" + mapData.length + " Y:" + mapData[0].length);
    }
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        const ctx = canvas.getContext('2d');
    
        for (let i = 0; i < canvas.width/canvasScale; i++) {
            for (let j = 0; j < canvas.height/canvasScale; j++) {
                const pixel = mapData[i][j];
                ctx.fillStyle = pixel.color.get();
                ctx.fillRect(i*canvasScale, j*canvasScale, canvasScale, canvasScale);

                //interactavle pixel gets highlighted
                if(pixel.status == PixelStatus.interact) {
                    if(pixel.highlight){
                        ctx.strokeStyle = interactCol.get();
                        ctx.lineWidth = 2;
                        ctx.strokeRect(i*canvasScale+1, j*canvasScale+1, canvasScale-2, canvasScale-2);
                    }
                }
            }
        }
        
        ctx.strokeStyle = Player.borderColor.get();
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x*canvasScale+1, Player.y*canvasScale+1, canvasScale-2, canvasScale-2);
    }
    /**
     * Updates the color border of interactable pixels
     */
    UpdateHighlightInteraction(){
        const ctx = canvas.getContext('2d');

        interactPosData.forEach(interact => {
            ctx.fillStyle = interact.color.get();
            ctx.fillRect(interact.x*canvasScale, interact.y*canvasScale, canvasScale, canvasScale);
        });
    }
    /**
     * Updates the resource count on the screen
     */
    UpdateResourcesScreen(){
        document.getElementById("stone").innerHTML = "Stone: "+Resources.stone;
        document.getElementById("wood").innerHTML = "Wood: "+Resources.wood;
    }
}
//Class for terrain modification
class TerrainManipulator{
    /**
     * Inserts a pixel at the given position
     * @param {number} x 
     * @param {number} y 
     * @param {PixelData} PixelData 
     */
    ModifyMapData(x, y, PixelData){
        mapData[x][y] = PixelData;
    }
    /**
     * 
     * @param {Array<Array<PixelData>>} NewMapData 
     * @returns 
     */
    InsertMapDataRaw(NewMapData){
        if(mapData.length != NewMapData.length || mapData[0].length != NewMapData[0].length) {
            console.error('Map size is not matched');
            return;
        }

        mapData = NewMapData;
    }
    /**
     * Inserts a interactable pixel at the pixel inner position
     * @param {InteractData} Pixel 
     */
    InsertInteractPixel(Pixel){
        interactPosData.push({x: Pixel.x, y: Pixel.y})
        Terrain.ModifyMapData(Pixel.x, Pixel.y, Pixel);

        switch(Pixel.interactType){
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
    DeleteInteractPixel(pX, pY){
        switch(mapData[pX][pY].interactType){
            case InteractType.stone:
                ResourceTerrain.stone--;
                break;
            case InteractType.wood:
                ResourceTerrain.wood--;
                break;
            default:
                throw new ReferenceError("Unknown interactable type");
        }

        for (let i = 0; i < interactPosData.length; i++) {
            if(interactPosData[i].x == pX && interactPosData[i].y == pY) {
                interactPosData.splice(i, 1);
                break;
            }
        }
        this.ModifyMapData(pX, pY,PerlinPixel(pX, pY));
    }
    /**
     * Clears the map and fills it with perlin noise
     */
    Clear(){
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                mapData[i][j] = PerlinPixel(i, j);
            }
        }
    }
    /**
     * Moves the given player by the X and Y amount
     * @param {PlayerData} Player 
     * @param {number} x 
     * @param {number} y 
     */
    MovePlayer(Player, x, y){
        let mPixel = mapData[Player.x + x][Player.y + y];
        if(mPixel.status != PixelStatus.free && mPixel.status != PixelStatus.taken) return; //TODO fix for floor

        this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
        Player.x += x;
        Player.y += y;
        Player.OverlapPixel = mapData[Player.x][Player.y]; //when building just modify overlapPixel
        this.ModifyMapData(Player.x, Player.y, new PixelData(Player.color));
    }

    /**
     * Tries to generate a random resource on the map
     */
    GenerateRandomResource(){
        let rand = Math.random();
        const spawnArea = 12;

        let centerVec = {
            x: Math.floor(mapData.length / 2),
            y: Math.floor(mapData[0].length / 2),
        }
        let pX;
        let pY;

        //gets a position outside of spawn area
        do{
            pX = Math.floor((Math.random() * mapData.length- 2) + 1);
            pY = Math.floor((Math.random() * mapData[0].length -2) + 1);
        }while(((pX > centerVec.x-spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y-spawnArea && pY < centerVec.y + spawnArea)))

        if(rand < (ResourceTerrain.wood/ResourceTerrain.stone)/3) this.GenerateStone(pX, pY);
        else this.GenerateTree(pX, pY);
    }
    /**
     * Generates a tree at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateTree(x,y){
        if(ResourceTerrain.wood + 5 > MaxTResource.wood) return;

        //check if there is a space for the tree in a 3x3 grid
        for(let i = x-1; i <= x+1; i++){
            if(i < 0 || i > mapData.length) return;
            for(let j = y-1; j<=y+1; j++){
                if(j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.free) return;
            }
        }

        const tPixel = new InteractData(new rgb(200, 70, 50), x, y, InteractType.wood);
        Terrain.InsertInteractPixel(tPixel);
        
        let lPixel = new InteractData(new rgb(49, 87, 44), x+1, y, InteractType.wood, 2);
        Terrain.InsertInteractPixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x-1, y, InteractType.wood, 2);
        Terrain.InsertInteractPixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x, y+1, InteractType.wood, 2);
        Terrain.InsertInteractPixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x, y-1, InteractType.wood, 2);
        Terrain.InsertInteractPixel(lPixel);
    }
    /**
     * Generates a stone at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateStone(x,y){
        if(ResourceTerrain.stone + 5 > MaxTResource.stone) return;

        //check if stone can freely spawn in a 3x3 grid
        for(let i = x-1; i <= x+1; i++){
            if(i < 0 || i > mapData.length) return;
            for(let j = y-1; j<=y+1; j++){
                if(j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.free) return;
            }
        }

        let rPixel;
        rPixel = new InteractData(new rgb(200, 200, 200), x, y, InteractType.stone);
        Terrain.InsertInteractPixel(rPixel);
        let sPixel = new InteractData(new rgb(200, 200, 200), x, y, InteractType.stone);
        Terrain.InsertInteractPixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x+1, y, InteractType.stone);
        Terrain.InsertInteractPixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x-1, y, InteractType.stone);
        Terrain.InsertInteractPixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x, y+1, InteractType.stone);
        Terrain.InsertInteractPixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x, y-1, InteractType.stone);
        Terrain.InsertInteractPixel(sPixel);

        let stoneVec = {
            x: 1,
            y: 1
        }
        if(Math.random() < 0.5) stoneVec.x *= -1;
        if(Math.random() < 0.5) stoneVec.y *= -1;

        sPixel = new InteractData(new rgb(200, 200, 200), x+stoneVec.x, y+stoneVec.y, InteractType.stone);
        Terrain.InsertInteractPixel(sPixel);
    }
}