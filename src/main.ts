/// <reference path="Terrain.ts" />
/// <reference path="Rendering.ts" />
/// <reference path="Lighting.ts" />

declare const seed: number;

//check if user is on mobile
const isMobile = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i);
document.getElementById("Mobile-Blocker")!.style.display = isMobile ? "block" : "none";

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('gameCanvas')!; 
const ctx = canvas.getContext('2d', { alpha: false })!;

let canvasScale: number = 10;

const ResourceTerrain = new ResourceList();
const MaxTResource = new ResourceList().Add(ResourceTypes.wood, 60).Add(ResourceTypes.stone,55);

let Player: PlayerData;
let EnemyList: EnemyData[] = [];

function Start(){
    GameTime.ins = new GameTime();
    ResourceManager.ins = new ResourceManager();
    RecipeHandler.ins = new RecipeHandler();

    Terrain.ins = new Terrain(seed);

    //sets player position in the middle of the map
    Player = new PlayerData(new rgb(0, 0, 0), new rgb(255, 255, 255), 
        1,1 , 10);

    Renderer.ins = new Renderer();
    QuestManager.ins = new QuestManager();

    Renderer.ins.Draw();

    const numOfBuildings = Math.floor(RandomUsingSeed(seed)()*2)+1; // 1-2 buildings
    Terrain.ins.GenerateRandomStructures(numOfBuildings, RandomUsingSeed(seed));

    for(let i = 0; i < 40; i++){
        Terrain.ins.GenerateRandomResource();
    }

    Player.FindAndSetSpawnPos();
    Terrain.ins.MovePlayer(Player, 0, 0); //Draw player

    ResourceManager.ins.DisplayCostResources(SelectedBuilding.cost);
}

let isBuilding = false;
let EnemyMovementInterval = 0;
function Update(){
    if(Player.respawnTime <= 0){
        EnemyMovementInterval++;
        if(EnemyMovementInterval >= 2){
            EnemyMovementInterval = 0;
            //Enemy movement
            EnemyList.forEach(e => e.MoveToPlayer());
        }

        //placement logic
        isBuilding = false;
        if(inputPresses.includes("KeyE") && canPlaceBuildingOn(Player.OverlapPixel))
        {
            Build(SelectedBuilding);
            RecipeHandler.ins.UpdatevAvalibleRecipes();
        }

        //digging underneath player logic
        if(inputPresses.includes("KeyQ")){
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
        Player.MoveBy(MovementVector.x, MovementVector.y);

        //Resource spawner
        if(Math.random() > 0.98){
            Terrain.ins.GenerateRandomResource();
        }
    }

    UpdateInput();

    GameTime.ins.Tick();

    Renderer.ins.Draw();
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);