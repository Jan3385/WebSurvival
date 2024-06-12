const canvas = document.getElementById('gameCanvas'); 
let mapData = [];
let interactPosData = [];

class rgb{
    constructor(r,g,b){
        this.r = r;
        this.g = g;
        this.b = b;
    }
    get(){
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
    }
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
    constructor(color, status = PixelStatus.free){
        this.color = color;
        this.status = status;
    }
}
function PerlinPixel(x,y){
    const pColor = Perlin.perlinColorTerrain(x/9,y/9);
    return new PixelData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s);
}
const EmptyPixel = new PixelData(new rgb(147, 200, 0));
class PlayerData extends PixelData{
    constructor(color, borderColor, x, y){
        super(color, PixelStatus.block);
        this.borderColor = borderColor;
        this.x = x;
        this.y = y;
        this.OverlapPixel = PerlinPixel(x, y);
    }

}
const InteractType = {
    stone: "stone",
    wood: "wood",
    door: "door"
};
class InteractData extends PixelData{
    constructor(color, x, y, type, hp = 6){
        super(color, PixelStatus.interact);
        this.x = x;
        this.y = y;
        this.interactType = type;
        this.health = hp;
    }
    Damage(){
        this.health--;
        this.color.Darken(1.3);
        if(this.health <= 0) {
            Terrain.DeleteInteractPixel(this.x, this.y);
            return true;
        }
        return false;
    }
}
let interactCol = new rgb(0, 0, 0);
//Class for rendering the game
class Renderer{
    constructor(){
        this.canvasScale = 10;

        this.init();
        this.Draw();
    }
    init(){
        if(canvas.width % this.canvasScale != 0 || canvas.height % this.canvasScale != 0) 
            console.error('Canvas size is not divisible by scale');

        for (let i = 0; i < canvas.width/this.canvasScale; i++) {
            mapData[i] = [];
            for (let j = 0; j < canvas.height/this.canvasScale; j++) {
                mapData[i][j] = PerlinPixel(i, j); 
            }
        }
        console.log("initialised zanvas with array of X:" + mapData.length + " Y:" + mapData[0].length);
    }
    Draw() {
        const ctx = canvas.getContext('2d');
    
        for (let i = 0; i < canvas.width/this.canvasScale; i++) {
            for (let j = 0; j < canvas.height/this.canvasScale; j++) {
                const pixel = mapData[i][j];
                ctx.fillStyle = pixel.color.get();
                ctx.fillRect(i*this.canvasScale, j*this.canvasScale, this.canvasScale, this.canvasScale);

                //interactavle pixel gets highlighted
                if(pixel.status == PixelStatus.interact) {
                    ctx.strokeStyle = interactCol.get();
                    ctx.lineWidth = 2;
                    ctx.strokeRect(i*this.canvasScale+1, j*this.canvasScale+1, this.canvasScale-2, this.canvasScale-2);
                }
            }
        }
        ctx.strokeStyle = Player.borderColor.get();
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x*this.canvasScale+1, Player.y*this.canvasScale+1, this.canvasScale-2, this.canvasScale-2);
    }
    UpdateHighlightInteraction(){
        const ctx = canvas.getContext('2d');

        interactPosData.forEach(interact => {
            ctx.fillStyle = interact.color.get();
            ctx.fillRect(interact.x*this.canvasScale, interact.y*this.canvasScale, this.canvasScale, this.canvasScale);
        });
    }
    ChangeInteractionIndicator(){
        const ctx = canvas.getContext('2d');
        interactPosData.forEach(interact => {
            ctx.fillStyle = interact.color.get();
            ctx.fillRect(interact.x*this.canvasScale, interact.y*this.canvasScale, this.canvasScale, this.canvasScale);
        });
    }
    UpdateResources(){
        document.getElementById("stone").innerHTML = "Stone: "+Resources.stone;
        document.getElementById("wood").innerHTML = "Wood: "+Resources.wood;
    }
}
let ResourceTerrain = {
    stone: 0,
    wood: 0
}
const MaxTResource = {
    stone: 20,
    wood: 30
}
//Class for terrain modification
class TerrainManipulator{
    ModifyMapDataRaw(x, y, PixelData){
        mapData[x][y] = PixelData;
    }
    InsertMapData(NewMapData){
        if(mapData.length != NewMapData.length || mapData[0].length != NewMapData[0].length) {
            console.error('Map size is not matched');
            return;
        }

        mapData = NewMapData;
    }
    InsertInteractPixel(Pixel){
        interactPosData.push({x: Pixel.x, y: Pixel.y})
        Terrain.ModifyMapDataRaw(Pixel.x, Pixel.y, Pixel);

        switch(Pixel.interactType){
            case InteractType.stone:
                ResourceTerrain.stone++;
                break;
            case InteractType.wood:
                ResourceTerrain.wood++;
                break;
        }
    }
    DeleteInteractPixel(pX, pY){
        switch(mapData[pX][pY].interactType){
            case InteractType.stone:
                ResourceTerrain.stone--;
                break;
            case InteractType.wood:
                ResourceTerrain.wood--;
                break;
        }

        for (let i = 0; i < interactPosData.length; i++) {
            if(interactPosData[i].x == pX && interactPosData[i].y == pY) {
                interactPosData.splice(i, 1);
                break;
            }
        }
        this.ModifyMapDataRaw(pX, pY,PerlinPixel(pX, pY));
    }
    Clear(){
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                mapData[i][j] = PerlinPixel(i, j);
            }
        }
    }
    MovePlayer(Player, x, y){
        this.ModifyMapDataRaw(Player.x, Player.y, Player.OverlapPixel);
        Player.x += x;
        Player.y += y;
        Player.OverlapPixel = mapData[Player.x][Player.y]; //when building just modify overlapPixel
        this.ModifyMapDataRaw(Player.x, Player.y, new PixelData(Player.color));
    }
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

        if(rand < 0.4) this.GenerateStone(pX, pY);
        else this.GenerateTree(pX, pY);
    }
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

let Player = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 10, 10);
let Render = new Renderer();
let Terrain = new TerrainManipulator();

Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);
setInterval(UpdateInteractionIndicator, 1000);

function Start(){
    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Render.Draw();
}

let Resources = {
    stone: 0,
    wood: 0,
}

function Update(){
    // movement
    const movVec = {x: 0, y: 0};
    switch(InputKey){
        case 87:
            movVec.y = -1;
            break;
        case 68:
            movVec.x = 1;
            break;
        case 83:
            movVec.y = 1;
            break;
        case 65:
            movVec.x = -1;
            break;
    }
    //movement checker
    let moveTileStatus = mapData[Player.x + movVec.x][Player.y + movVec.y].status;

    if(moveTileStatus == PixelStatus.interact ||moveTileStatus == PixelStatus.taken){
        const iPixel = mapData[Player.x + movVec.x][Player.y + movVec.y];
        let brokePixel;
        switch(mapData[Player.x + movVec.x][Player.y + movVec.y].interactType){
            case InteractType.stone:
                brokePixel = iPixel.Damage();
                if(brokePixel) Resources.stone+= Math.floor(1 + Math.random()*2);
                break;
            case InteractType.wood:
                brokePixel = iPixel.Damage();
                if(brokePixel) Resources.wood+= Math.floor(1 + Math.random()*2);
                break;
            case InteractType.door:
                break;
        }
        Render.UpdateResources();
    } 

    if(moveTileStatus == PixelStatus.free) 
        Terrain.MovePlayer(Player, movVec.x, movVec.y);

    UpdateInput();

    //Resource spawner
    if(Math.random() > 0.9){
        Terrain.GenerateRandomResource();
    }

    Render.Draw();
}
function UpdateInteractionIndicator(){
    if(interactCol.get() == new rgb(0, 0, 0).get()) interactCol = new rgb(40, 40, 40);
    else interactCol = new rgb(0, 0, 0);
}