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
    constructor(color, x, y){
        super(color, PixelStatus.block);
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
    constructor(color, x, y, type){
        super(color, PixelStatus.interact);
        this.x = x;
        this.y = y;
        this.interactType = type;
        this.health = 10;
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
        this.canvasScale = 12;

        this.init();
        this.Draw();
    }
    init(){
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
                    ctx.strokeRect(i*this.canvasScale, j*this.canvasScale, this.canvasScale-1, this.canvasScale-1);
                }
            }
        }
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
}
let ResourceTerrain = {
    stone: 0,
    wood: 0
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
}

let Player = new PlayerData(new rgb(175, 71, 210), 10, 10);
let Render = new Renderer();
let Terrain = new TerrainManipulator();

Start();
const frameRate = 7;
setInterval(Update, 1000/frameRate);
setInterval(UpdateInteractionIndicator, 1500);

function Start(){
    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Terrain.InsertInteractPixel(new InteractData(new rgb(100, 255, 255), 12, 12, InteractType.stone));
    Render.Draw();
}

let Resources = {
    stone: 0,
    wood: 0,
}

function Update(){
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
    if(mapData[Player.x + movVec.x][Player.y + movVec.y].status == PixelStatus.interact){
        const iPixel = mapData[Player.x + movVec.x][Player.y + movVec.y];
        let brokePixel;
        switch(mapData[Player.x + movVec.x][Player.y + movVec.y].interactType){
            case InteractType.stone:
                brokePixel = iPixel.Damage();
                if(brokePixel) Resources.stone+= Math.floor(Math.random() * 3);
                break;
            case InteractType.wood:
                brokePixel = iPixel.Damage();
                if(brokePixel) Resources.wood+= Math.floor(Math.random() * 3);
                break;
            case InteractType.door:
                break;
        }
    } 
    if(mapData[Player.x + movVec.x][Player.y + movVec.y].status == PixelStatus.free) 
        Terrain.MovePlayer(Player, movVec.x, movVec.y);

    UpdateInput();

    Render.Draw();
}
function UpdateInteractionIndicator(){
    if(interactCol.get() == new rgb(0, 0, 0).get()) interactCol = new rgb(122, 122, 0);
    else interactCol = new rgb(0, 0, 0);
}