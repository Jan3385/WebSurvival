/// <reference path="RTClass.ts" />
/// <reference path="Lighting.ts" />

//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker")!.style.display = isMobile ? "block" : "none";

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('gameCanvas')!; 
let canvasScale: number = 10;
const gTime = new GameTime();
let mapData: PixelData[][] = [];


let ResourceTerrain = {
    stone: 0,
    wood: 0
}
const MaxTResource = {
    stone: 20,
    wood: 30
}

//sets player position in the middle of the map
let Player: PlayerData = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 
    Math.floor(canvas.width/canvasScale/2), Math.floor(canvas.height/canvasScale/2));

let Render = new Renderer();
let Terrain = new TerrainManipulator();

setInterval(UpdateInteractionIndicator, 1000);

let Resources = {
    stone: 0,
    wood: 0,
}

function Start(){
    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Render.Draw();

    for(let i = 0; i < 20; i++){
        Terrain.GenerateRandomResource();
    }

    cheat();
}

let isBuilding = false;
function Update(){
    //movement checker
    const moveTile = mapData[Player.x + MovementVector.x][Player.y + MovementVector.y];

    //placement logic
    isBuilding = false;
    if(inputPresses.includes(69) && canPlaceBuildingOn(Player.OverlapPixel))
    {
        Build(SelectedBuilding);
    }

    //digging underneath player logic
    if(inputPresses.includes(81)){
        //if standing on a building damage it
        if(Player.OverlapPixel instanceof BuildingData){
            let brokePixel = Player.OverlapPixel.DamageNoDelete();

            if(brokePixel){
                Player.OverlapPixel = PerlinPixel(Player.x, Player.y);
            }
        }
    }

    //movement interactions
    if(moveTile.status == PixelStatus.interact && moveTile instanceof InteractData){
        let brokePixel: boolean;
        switch(moveTile.interactType){
            case InteractType.stone:
                brokePixel = moveTile.Damage();
                if(brokePixel) Resources.stone+= Math.floor(1 + Math.random()*2);
                break;
            case InteractType.wood:
                brokePixel = moveTile.Damage();
                if(brokePixel) Resources.wood+= Math.floor(1 + Math.random()*2);
                break;
            case InteractType.wall:
                moveTile.Damage();
                break;
            case InteractType.floor:
            case InteractType.door:
                if(MovementVector.x == 0 && MovementVector.y == 0) break;
                //ignore door and floor
                Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
                break;
        }
        Render.UpdateResourcesScreen();
    } 
    else if(!(MovementVector.x == 0 && MovementVector.y == 0)){
        Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
    }

    UpdateInput();

    //Resource spawner
    if(Math.random() > 0.98){
        Terrain.GenerateRandomResource();
    }

    gTime.Tick();

    Render.Draw();
}
function UpdateInteractionIndicator(): void{
    if(interactCol.get() == new rgb(60, 60, 60).get()) interactCol = new rgb(50, 50, 50);
    else interactCol = new rgb(60, 60, 60);
}
function GetPixelInfo(x: number,y: number): PixelData{
    return mapData[x][y];
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);