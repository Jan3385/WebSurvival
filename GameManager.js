const canvas = document.getElementById('gameCanvas'); 
let canvasScale = 10;
let mapData = [];
let interactPosData = [];


let ResourceTerrain = {
    stone: 0,
    wood: 0
}
const MaxTResource = {
    stone: 20,
    wood: 30
}

let Player = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 
    Math.floor(canvas.width/canvasScale/2), Math.floor(canvas.height/canvasScale/2));
let Render = new Renderer();
let Terrain = new TerrainManipulator();

Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);
setInterval(UpdateInteractionIndicator, 1000);

function Start(){
    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Render.Draw();

    for(let i = 0; i < 20; i++){
        Terrain.GenerateRandomResource();
    }
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
        Render.UpdateResourcesScreen();
    } 

    if(moveTileStatus == PixelStatus.free) 
        Terrain.MovePlayer(Player, movVec.x, movVec.y);

    UpdateInput();

    //Resource spawner
    if(Math.random() > 0.98){
        Terrain.GenerateRandomResource();
    }

    Render.Draw();
}
function UpdateInteractionIndicator(){
    if(interactCol.get() == new rgb(0, 0, 0).get()) interactCol = new rgb(40, 40, 40);
    else interactCol = new rgb(0, 0, 0);
}