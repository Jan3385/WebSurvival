/// <reference path="Terrain.ts" />
/// <reference path="Rendering.ts" />
/// <reference path="Lighting.ts" />

//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker")!.style.display = isMobile ? "block" : "none";

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('gameCanvas')!; 
const ctx = canvas.getContext('2d', { alpha: false })!;

let canvasScale: number = 10;


const ResourceTerrain = new ResourceList();
const MaxTResource = new ResourceList().Add(ResourceTypes.wood, 60).Add(ResourceTypes.stone,55);

//sets player position in the middle of the map
const Player: PlayerData = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 
    Math.floor(canvas.width/canvasScale/2), Math.floor(canvas.height/canvasScale/2), 10);

function Start(){
    GameTime.ins = new GameTime();
    ResourceManager.ins = new ResourceManager();
    RecipeHandler.ins = new RecipeHandler();

    Terrain.ins = new Terrain();
    Renderer.ins = new Renderer();
    QuestManager.ins = new QuestManager();

    Terrain.ins.MovePlayer(Player, 0, 0); //Draw player
    Renderer.ins.Draw();

    //TODO: Maybe fix?
    //Terrain.GenerateRandomStructures(2, RandomUsingSeed(Seed));

    for(let i = 0; i < 40; i++){
        Terrain.ins.GenerateRandomResource();
    }

    ResourceManager.ins.DisplayCostResources(SelectedBuilding.cost);

    ResourceManager.ins.Cheat();
}

let isBuilding = false;
function Update(){
    //movement checker
    if(
        Player.x + MovementVector.x < 0 || Player.x + MovementVector.x >= Terrain.ins.mapData.length || 
        Player.y + MovementVector.y < 0 || Player.y + MovementVector.y >= Terrain.ins.mapData[0].length
    ){
        //player will not move out of bounds
        MovementVector = new Vector2(0, 0);
    }
    const moveTile = Terrain.ins.mapData[Player.x + MovementVector.x][Player.y + MovementVector.y];


    //placement logic
    isBuilding = false;
    if(inputPresses.includes(69) && canPlaceBuildingOn(Player.OverlapPixel))
    {
        Build(SelectedBuilding);
        RecipeHandler.ins.UpdatevAvalibleRecipes();
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

                RecipeHandler.ins.UpdatevAvalibleRecipes();
            }
        }
        if(Player.OverlapPixel instanceof TerrainData){
            if(Player.OverlapPixel.type == TerrainType.sand){
                if(Math.random() < 0.3) ResourceManager.ins.AddResource(ResourceTypes.sand, 1);
            }
        }
    }

    //movement interactions
    if(moveTile instanceof ResourceData){
        moveTile.Damage(1);
    }
    else if(moveTile instanceof BuildingData && moveTile.status == PixelStatus.breakable){
        if(IsDamageable(moveTile)) (<IDamageable>moveTile).Damage(1);
        RecipeHandler.ins.UpdatevAvalibleRecipes();
    }
    else if(IsInteractable(moveTile) && moveTile.status == PixelStatus.interact) (<IInteractable>moveTile).Interact();
    else if(!(MovementVector.x == 0 && MovementVector.y == 0)){
        Terrain.ins.MovePlayer(Player, MovementVector.x, MovementVector.y);
        RecipeHandler.ins.UpdatevAvalibleRecipes();
    }

    UpdateInput();

    document.getElementById("Time")!.innerHTML = GameTime.ins.GetDayTime(); //shows time

    //Resource spawner
    if(Math.random() > 0.98){
        Terrain.ins.GenerateRandomResource();
    }

    GameTime.ins.Tick();

    Renderer.ins.Draw();
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);