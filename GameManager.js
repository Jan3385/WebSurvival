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
    if(inputPresses.includes(69) && Player.OverlapPixel.status == PixelStatus.free) {
        if(Resources.stone >= SelectedBuilding.cost.stone
            && Resources.wood >= SelectedBuilding.cost.wood){
                
                Resources.stone -= SelectedBuilding.cost.stone;
                Resources.wood -= SelectedBuilding.cost.wood;

                Player.OverlapPixel = SelectedBuilding.build.at(Player.x, Player.y);
                Render.UpdateResourcesScreen();
                isBuilding = true;
        }
    }

    //digging underneath player logic
    if(inputPresses.includes(81)){
        //if standing on a building damage it
        if(Player.OverlapPixel instanceof InteractData){
            let brokePixel = Player.OverlapPixel.DamageNoDelete();
            console.log(Player.OverlapPixel)
            if(brokePixel){
                Player.OverlapPixel = PerlinPixel(Player.x, Player.y);
            }
        }
    }

    //movement interactions
    if(moveTile.status == PixelStatus.interact){
        let brokePixel;
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
                if(!isBuilding){
                    Terrain.MovePlayer(Player, MovementVector.x, 0);
                    Terrain.MovePlayer(Player, 0, MovementVector.y);
                }else{
                    if(MovementVector.x != 0) MovementVector.y = 0;
                    Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
                }
                break;
        }
        Render.UpdateResourcesScreen();
    } 
    else if(!(MovementVector.x == 0 && MovementVector.y == 0)){
        //moves player
        //if player is not building allow diagonal movement else only move non-diagonaly
        if(!isBuilding){
            Terrain.MovePlayer(Player, MovementVector.x, 0);
            Terrain.MovePlayer(Player, 0, MovementVector.y);
        }else{
            if(MovementVector.x != 0) MovementVector.y = 0;
            Terrain.MovePlayer(Player, MovementVector.x, MovementVector.y);
        }
    }
    
    

    UpdateInput();

    //Resource spawner
    if(Math.random() > 0.98){
        Terrain.GenerateRandomResource();
    }

    Render.Draw();
}
function UpdateInteractionIndicator(){
    if(interactCol.get() == new rgb(60, 60, 60).get()) interactCol = new rgb(50, 50, 50);
    else interactCol = new rgb(60, 60, 60);
}
function GetPixelInfo(x,y){
    return mapData[x][y];
}
Start();
let tickSpeed = 7;
setInterval(Update, 1000/tickSpeed);