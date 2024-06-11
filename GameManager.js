const canvas = document.getElementById('gameCanvas'); 
let mapData = [];

function rgb(r, g, b){
    return 'rgb(' + r + ',' + g + ',' + b + ')';
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
    return new PixelData(pColor.c, pColor.s);
}
const EmptyPixel = new PixelData(rgb(147, 200, 0));
class PlayerData extends PixelData{
    constructor(color, x, y){
        super(color, PixelStatus.block);
        this.x = x;
        this.y = y;
        this.OverlapPixel = PerlinPixel(x, y);
    }

}
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
                ctx.fillStyle = pixel.color;
                ctx.fillRect(i*this.canvasScale, j*this.canvasScale, this.canvasScale, this.canvasScale);
            }
        }
    }
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
    
    Clear(){
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                mapData[i][j] = PerlinPixel(i, j);
            }
        }

        //promazat render
        
    }
    MovePlayer(Player, x, y){
        this.ModifyMapDataRaw(Player.x, Player.y, Player.OverlapPixel);
        Player.x += x;
        Player.y += y;
        Player.OverlapPixel = mapData[Player.x][Player.y]; //when building just modify overlapPixel
        this.ModifyMapDataRaw(Player.x, Player.y, new PixelData(Player.color));
    }
}

let Player = new PlayerData(rgb(175, 71, 210), 10, 10);
let Render = new Renderer();
let Terrain = new TerrainManipulator();

Start();
const frameRate = 7;
setInterval(Update, 1000/frameRate);

function Start(){
    Terrain.MovePlayer(Player, 0, 0); //Draw player
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
    if(mapData[Player.x + movVec.x][Player.y + movVec.y].status == PixelStatus.free) 
        Terrain.MovePlayer(Player, movVec.x, movVec.y);

    UpdateInput();

    Render.Draw();
}