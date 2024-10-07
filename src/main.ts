/// <reference path="Terrain.ts" />
/// <reference path="Rendering.ts" />
/// <reference path="Lighting.ts" />

//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker")!.style.display = isMobile ? "block" : "none";

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('gameCanvas')!; 
const ctx = canvas.getContext('2d', { alpha: false })!;

let canvasScale: number = 10;
const gTime = new GameTime();
let mapData: PixelData[][] = [];


const ResourceTerrain = new ResourceList();
const MaxTResource = new ResourceList().Add(ResourceTypes.wood, 60).Add(ResourceTypes.stone,55);

//sets player position in the middle of the map
const Player: PlayerData = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 
    Math.floor(canvas.width/canvasScale/2), Math.floor(canvas.height/canvasScale/2), 10);

const Render = new Renderer();
const Terrain = new TerrainManipulator();

const Resources = new ResourceManager();
const Recipes = new RecipeHandler();

function Start(){
    QuestManager.instance = new QuestManager(); //redo all systems like this

    Terrain.MovePlayer(Player, 0, 0); //Draw player
    Render.Draw();

    //TODO: Maybe fix?
    //Terrain.GenerateRandomStructures(2, RandomUsingSeed(Seed));

    for(let i = 0; i < 40; i++){
        Terrain.GenerateRandomResource();
    }

    Resources.DisplayCostResources(SelectedBuilding.cost);

    Resources.Cheat();
}

let isBuilding = false;
function Update(){
    //movement checker
    if(
        Player.x + MovementVector.x < 0 || Player.x + MovementVector.x >= mapData.length || 
        Player.y + MovementVector.y < 0 || Player.y + MovementVector.y >= mapData[0].length
    ){
        //player will not move out of bounds
        MovementVector = new Vector2(0, 0);
    }
    const moveTile = mapData[Player.x + MovementVector.x][Player.y + MovementVector.y];


    //placement logic
    isBuilding = false;
    if(inputPresses.includes(69) && canPlaceBuildingOn(Player.OverlapPixel))
    {
        Build(SelectedBuilding);
        Recipes.UpdatevAvalibleRecipes();
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

                Recipes.UpdatevAvalibleRecipes();
            }
        }
        if(Player.OverlapPixel instanceof TerrainData){
            if(Player.OverlapPixel.type == TerrainType.sand){
                if(Math.random() < 0.3) Resources.AddResource(ResourceTypes.sand, 1);
            }
        }
    }

    //movement interactions
    if(moveTile instanceof ResourceData){
        moveTile.Damage(1);
    }
    else if(moveTile instanceof BuildingData && moveTile.status == PixelStatus.breakable){
        if(IsDamageable(moveTile)) (<IDamageable>moveTile).Damage(1);
        Recipes.UpdatevAvalibleRecipes();
    }
    else if(IsInteractable(moveTile) && moveTile.status == PixelStatus.interact) (<IInteractable>moveTile).Interact();
    else if(!(MovementVector.x == 0 && MovementVector.y == 0)){
        Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
        Recipes.UpdatevAvalibleRecipes();
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