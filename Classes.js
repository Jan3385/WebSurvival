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
    changeBy(val){
        return new rgb(this.r + val, 
                        this.g + val, 
                        this.b + val);
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
const _Highlight = {
    none: 0,
    lightBorder: 1,
    border: 2,
    thickBorder: 3,
    slash: 4,
}
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
    constructor(color, x, y, type, hp = 6, highlight = _Highlight.border){
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
     * @param {_Highlight} highlight
     * @param {InteractType} interactionType
     */
    constructor(color, x, y, walkStatus, hp = 12, highlight = _Highlight.border, interactionType){
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
    DamageNoDelete(){
        this.health--;
        this.color.Darken(1.07);
        if(this.health <= 0) {
            return true;
        }
        return false;
    }
    FullyHeal(){
        this.health = this.maxHealh;
        this.color = this.defaultColor;
    }
}
class DoorData extends BuildingData{
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
    constructor(color, x, y, walkStatus, hp = 12, highlight = _Highlight.border, interactionType){
        super(color, x, y, walkStatus, hp, highlight, interactionType);
        this.isOpen = false;
    }
    at(x,y){
        return new DoorData(this.defaultColor.newSlightlyRandom(30), x, y, this.walkStatus, this.maxHealh, this.highlight, this.interactType);
    }
    Open(){
        if(this.isOpen) return;

        this.walkStatus = PixelStatus.taken;
        this.color = this.color.changeBy(-30);
        this.highlight = _Highlight.lightBorder;
        this.isOpen = true;
    }
    Close(){
        if(!this.isOpen) return;

        this.walkStatus = PixelStatus.block;
        this.color = this.color.changeBy(+30);
        this.highlight = _Highlight.slash;
        this.isOpen = false;
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
        //set canvas size
        let resolution = {x: 64, y: 48}; 
        canvas.width = Math.floor(window.innerWidth * canvasPixel.x/150);
        canvas.height = Math.floor(window.innerWidth * canvasPixel.y/150);

        pixelScale = canvas.width/canvasPixel.x;
        canvas.width = Math.floor(canvas.width - Math.floor(canvas.width % pixelScale));
        canvas.height = Math.floor(canvas.height - Math.floor(canvas.height % pixelScale));

        console.log("Canvas width: " + canvas.width);

        if(Math.floor(canvas.width % pixelScale) != 0 || Math.floor(canvas.height % pixelScale) != 0) {
            console.error('Canvas size is not divisible by scale');
            console.error('Canvas width: ' + canvas.width + ' Canvas height: ' + canvas.height);
            console.error('Canvas scale: ' + pixelScale);
        }

        for (let i = 0; i < canvasPixel.x; i++) {
            mapData[i] = [];
            for (let j = 0; j < canvasPixel.y; j++) {
                mapData[i][j] = PerlinPixel(i, j); 
            }
        }
        console.log("initialised canvas with array of X:" + mapData.length + " Y:" + mapData[0].length);
    }
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        const ctx = canvas.getContext('2d');
    
        ctx.beginPath(); //Clear ctx from prev. frame
        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                const pixel = mapData[i][j];
                ctx.fillStyle = pixel.color.get();
                ctx.fillRect(i*pixelScale, j*pixelScale, pixelScale-1, pixelScale-1);

                //interactavle pixel gets highlighted
                if(pixel.status == PixelStatus.interact) {
                    switch(pixel.highlight){
                        case _Highlight.none:
                            break;
                        case _Highlight.lightBorder:
                            ctx.strokeStyle = interactCol.get();
                            ctx.lineWidth = 1;
                            ctx.strokeRect(i*pixelScale+1, j*pixelScale+1, pixelScale-2, pixelScale-2);
                            break;
                        case _Highlight.border:
                            ctx.strokeStyle = interactCol.get();
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i*pixelScale, j*pixelScale, pixelScale-1, pixelScale-1);
                            break;
                        case _Highlight.thickBorder:
                            ctx.strokeStyle = interactCol.get();
                            ctx.lineWidth = 4;
                            ctx.strokeRect(i*pixelScale+2, j*pixelScale+2, pixelScale-4, pixelScale-4);
                            break;
                        case _Highlight.slash:
                            ctx.strokeStyle = interactCol.get();
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i*pixelScale+1, j*pixelScale+1, pixelScale-2, pixelScale-2);
                            
                            ctx.moveTo(i*pixelScale+1, j*pixelScale+1);
                            ctx.lineTo(i*pixelScale+pixelScale-1, j*pixelScale+pixelScale-1);
                            break;
                    }
                }
            }
        }
        ctx.lineWidth = 2;
        ctx.stroke(); //write all the diagonal lines
        
        ctx.strokeStyle = Player.borderColor.get();
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x*pixelScale+1, Player.y*pixelScale+1, pixelScale-2, pixelScale-2);
    }
    /**
     * Updates the color border of interactable pixels
     */
    UpdateHighlightInteraction(){
        const ctx = canvas.getContext('2d');

        interactPosData.forEach(interact => {
            ctx.fillStyle = interact.color.get();
            ctx.fillRect(interact.x*pixelScale, interact.y*pixelScale, pixelScale, pixelScale);
        });
    }
    /**
     * Updates the resource count on the screen
     */
    UpdateResourcesScreen(){
        document.getElementById("stone").innerHTML = ": "+Resources.stone;
        document.getElementById("wood").innerHTML = ": "+Resources.wood;
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
        //check if the player can move to the given position
        if(mPixel.status == PixelStatus.free || mPixel.status == PixelStatus.taken || 
         (mPixel.status == PixelStatus.interact && mPixel.walkStatus == PixelStatus.taken)){

            //move the player

            //if is player exiting a door, lock it
            if(Player.OverlapPixel.status == PixelStatus.interact && 
              Player.OverlapPixel.interactType == InteractType.door && (x != 0 || y != 0)) {

                Player.OverlapPixel.Close();
            }

            this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
            Player.x += x;
            Player.y += y;
            Player.OverlapPixel = mapData[Player.x][Player.y];
            this.ModifyMapData(Player.x, Player.y, new PixelData(Player.color));

        }else if(mPixel.status == PixelStatus.interact && mPixel.interactType == InteractType.door){
            mPixel.Open();
        }
    }
    /**
     * Forcefully moves the player to a given X and Y position (skips any checks)
     * @param {PlayerData} Player 
     * @param {number} x 
     * @param {number} y 
     */
    ForceMovePlayer(Player, x, y){
        this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
        Player.x += x;
        Player.y += y;
        Player.OverlapPixel = mapData[Player.x][Player.y];
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

        let stoneVec = {x: 1, y: 1}
        let repeats = Math.floor(Math.random()*3)+1;
        for(let i = 0; i < repeats; i++) {
            stoneVec.x = Math.floor(Math.random()*2)-1;
            stoneVec.y = Math.floor(Math.random()*2)-1;
            if(stoneVec.x == 0) stoneVec.x = 1;
            if(stoneVec.y == 0) stoneVec.y = 1;

            sPixel = new InteractData(new rgb(200, 200, 200), x+stoneVec.x, y+stoneVec.y, InteractType.stone);
            Terrain.InsertInteractPixel(sPixel);
        }
    }
}