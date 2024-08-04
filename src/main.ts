/// <reference path="RTClass.ts" />
/// <reference path="Lighting.ts" />

//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker")!.style.display = isMobile ? "block" : "none";

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('gameCanvas')!; 
const ctx = canvas.getContext('2d', { alpha: false })!;

let canvasScale: number = 10;
const gTime = new GameTime();
let mapData: PixelData[][] = [];


let ResourceTerrain = new ResourceList();
const MaxTResource = new ResourceList().Add(ResourceTypes.wood, 20).Add(ResourceTypes.stone,30);

//sets player position in the middle of the map
let Player: PlayerData = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 
    Math.floor(canvas.width/canvasScale/2), Math.floor(canvas.height/canvasScale/2), 10);

let Render = new Renderer();
let Terrain = new TerrainManipulator();

let Resources = new ResourceManager();

function Start(){
    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Render.Draw();

    for(let i = 0; i < 20; i++){
        Terrain.GenerateRandomResource();
    }

    Resources.DisplayCostResources(SelectedBuilding.cost);

    Resources.Cheat();
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
            const brokePixel = Player.OverlapPixel.DamageNoDestroy(1);
            if(brokePixel){
                Player.OverlapPixel = Player.OverlapPixel.OverlaidPixel;

                //removes the interior if building below player is destroyed
                CheckDeleteInterior(Player.x, Player.y);
            }
        }
    }

    //movement interactions
    if(moveTile instanceof ResourceData){
        moveTile.Damage(1);
    }
    else if(moveTile instanceof BuildingData && moveTile.status == PixelStatus.breakable){
        if(IsDamageable(moveTile)) (<IDamageable>moveTile).Damage(1);
    }
    else if(IsInteractable(moveTile) && moveTile.status == PixelStatus.interact) (<IInteractable>moveTile).Interact();
    else if(!(MovementVector.x == 0 && MovementVector.y == 0)){
        Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
    }

    UpdateInput();

    document.getElementById("Time")!.innerHTML = gTime.GetDayTime(); //shows time

    //Resource spawner
    if(Math.random() > 0.98){
        Terrain.GenerateRandomResource();
    }

    gTime.Tick();

    Render.Draw();
}
function GetPixelInfo(x: number,y: number): PixelData{
    return mapData[x][y];
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);