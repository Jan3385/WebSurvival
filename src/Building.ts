/// <reference path="PixelData.ts" />
/// <reference path="Lighting.ts" />
/// <reference path="SupportClasses.ts" />
/// <reference path="Terrain.ts" />

let buildButtons: NodeListOf<HTMLElement> = document.getElementsByClassName("Selection-Button-Div")[0].querySelectorAll("button");
const BuildType = {
    Wall: 0,
    Floor: 1,
}
let Building = [
    {   //cheap wall
        build: new BuildingData("Cheap Wall", new rgb(244, 211, 94), PixelStatus.breakable, 3, 1,1, HighlightPixel.border),
        cost: new ResourceList().Add(ResourceTypes.wood, 3),
        label: "Cheap but weak"
    },
    {   //wooden wall
        build: new BuildingData("Wooden Wall", new rgb(127, 79, 36), PixelStatus.breakable, 3, 1,1, HighlightPixel.border),
        cost: new ResourceList().Add(ResourceTypes.wood, 10),
        label: "Stronger but more expensive"
    },
    {   //stone wall
        build: new BuildingData("Stone Wall", new rgb(85, 85, 85), PixelStatus.breakable, 3, 1,1, HighlightPixel.border),
        cost: new ResourceList().Add(ResourceTypes.wood, 2).Add(ResourceTypes.stone, 15),
        label: "Strong but expensive"
    },
    {   //cheap floor
        build: new BuildingData("Cheap Floor", new rgb(255, 243, 176), PixelStatus.walkable, 3, 1,1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.wood, 1),
        label: "Not the prettiest"
    },
    {   //wooden floor
        build: new BuildingData("Wooden Floor", new rgb(175, 164, 126), PixelStatus.walkable, 3, 1,1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.wood, 2),
        label: "Decent looking"
    },
    {   //stone floor
        build: new BuildingData("Stone Floor", new rgb(206, 212, 218), PixelStatus.walkable, 3, 1,1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.stone, 15),
        label: "Build with unforseen quality"
    },
    {   //cheap door
        build: new DoorData("Cheap Door", new rgb(255, 231, 230), 1, 1, 3),
        cost: new ResourceList().Add(ResourceTypes.wood, 10),
        label: "Gets you thru the night"
    },
    {   //wooden door
        build: new DoorData("Wooden Door", new rgb(200, 180, 166), 1, 1, 12),
        cost: new ResourceList().Add(ResourceTypes.wood, 20),
        label: "Feels like home"
    },
    {   //stone door
        build: new DoorData("Stone Door", new rgb(200, 200, 200), 1, 1, 24),
        cost: new ResourceList().Add(ResourceTypes.wood, 2).Add(ResourceTypes.stone, 25),
        label: "A door that will last"
    },
    {   //torch
        build: new LightData("Torch", new rgb(200, 185, 0), 1, 1, 4, 5, 5),
        cost: new ResourceList().Add(ResourceTypes.wood, 10).Add(ResourceTypes.stone, 2),
        label: "Lights up the night, burns out by sunrise"
    },
    {   //lantern
        build: new LightData("Lantern", new rgb(255, 255, 0), 1, 1, 4, 7, 7),
        cost: new ResourceList().Add(ResourceTypes.wood, 30).Add(ResourceTypes.stone, 7),
        label: "Lasts a lifetime!"
    },
    {   //LandFill
        build: new BuildingData("Landfill", new rgb(109, 76, 65), PixelStatus.walkable, 3, 1,1, HighlightPixel.none),
        cost: new ResourceList().Add(ResourceTypes.wood, 10).Add(ResourceTypes.stone, 1),
        label: "Fills the ocean!"
    },
    {   //Glass
        build: new GlassData("Glass", new rgb(178, 190, 195), 1, 1, 3),
        cost: new ResourceList().Add(ResourceTypes.wood, 4).Add(ResourceTypes.glass, 20),
        label: "Lets the sunlight thru"
    }
];

function FindBuilding(buildingName: String): BuildingData{
    const find = Building.find(x => x.build.name == buildingName)?.build;
    if(find == undefined) throw new Error("Building not found. Provided name: " + buildingName);
    return Building.find(x => x.build.name == buildingName)!.build;
}

let SelectedBuilding = Building[0];
document.getElementById("Selected-Building-Label")!.innerHTML = SelectedBuilding.build.name + " - " + SelectedBuilding.label;

let buildId = 0;
function SelectBuilding(id: number){
    //unselect previously selected building
    buildButtons[buildId].id = "Unselected";
    //select new building
    buildButtons[id].id = "Selected";

    //update buildId variable
    buildId = id;

    UpdateSelectedBuilding();
}
/**
 * Returns the id of the selected material
 * @returns {number}
 */
function GetSelectedMaterialId(){
    const option: string = (<HTMLInputElement>document.getElementById("Material-Select")!).value;

    return Number.parseInt(option);
}
function UpdateSelectedBuilding(){
    let id: number = buildId;

    //for building that have selectale materials use special treatment
    if(buildId <= 2){
        const materialId: number = GetSelectedMaterialId();
        id = buildId * 3 + materialId;
    }else{
        id = 6 + buildId;
    }
    SelectedBuilding = Building[id];

    //update label
    document.getElementById("Selected-Building-Label")!.innerHTML = SelectedBuilding.build.name + " - " + SelectedBuilding.label;
    //update cost display
    Resources.DisplayCostResources(SelectedBuilding.cost);
}
function canPlaceBuildingOn(pixel: PixelData): boolean{
    //cannot place floor on floor
    if(pixel instanceof BuildingData && pixel.status == PixelStatus.walkable){
        if(SelectedBuilding.build.status == PixelStatus.walkable) return false;
    }

    if(Player.OverlapPixel.status == PixelStatus.walkable) return true;
    return false;
}
function Build(
    BuildedBuilding: {
        build: BuildingData;
        cost: ResourceList;
        label: string;
    }): void{
    if(Resources.HasResources(BuildedBuilding.cost)){
            //if placing landfill
            if(BuildedBuilding.build.name == "Landfill"){
                BuildLandfill(Player.x, Player.y);
                return;
            }
            
            Resources.RemoveResourceList(BuildedBuilding.cost);

            const didBuildIndoors : boolean = Player.OverlapPixel.Indoors;
            Player.OverlapPixel = BuildedBuilding.build.at(Player.x, Player.y);
            isBuilding = true;

            //skip indoors check if placing a floor or similiar
            if(BuildedBuilding.build.status == PixelStatus.walkable) {
                Player.OverlapPixel.Indoors = didBuildIndoors;
                return;
            }
            //check if build is enclosed
            GetEnclosedSpacesAround(Player.x, Player.y).forEach((vec: Vector2) => {
                fillInterior(vec.x, vec.y);
            });
    }
}
function BuildLandfill(x: number, y: number): void{
    let didBuild: boolean = false;
    let BuildVectors: Vector2[] = [
        new Vector2(1, 0),
        new Vector2(0, 1),
        new Vector2(-1, 0),
        new Vector2(0, -1)
    ];

    for(let i = 0; i < BuildVectors.length; i++){
        if(x+BuildVectors[i].x < 0 || x+BuildVectors[i].x >= mapData.length) continue;
        if(y+BuildVectors[i].y < 0 || y+BuildVectors[i].y >= mapData[0].length) continue;
        
        if(
            mapData[x+BuildVectors[i].x][y+BuildVectors[i].y] instanceof TerrainData && 
            (<TerrainData>mapData[x+BuildVectors[i].x][y+BuildVectors[i].y]).type == TerrainType.water
        ){
            mapData[x+BuildVectors[i].x][y+BuildVectors[i].y] = new TerrainData(Building[11].build.color.newSlightlyRandom(10), PixelStatus.walkable, TerrainType.ground);
            didBuild = true;
        }
    }

    if(didBuild){
        Resources.RemoveResourceList(Building[11].cost);
    }
}

const AroundDir: Vector2[] = [
    new Vector2(0, 1), new Vector2(-1, 0), new Vector2(1, 0), new Vector2(0, -1)
];
/**
 * Returns an array of positions that are inside an enclosed space
 * @param x 
 * @param y 
 */
function GetEnclosedSpacesAround(x: number, y: number): Vector2[] {
    function checkEnclosedSpace(x: number, y: number): boolean{
        const CheckedPixel = mapData[x][y] instanceof PlayerData ? Player.OverlapPixel : mapData[x][y];
        if(CheckedPixel.status != PixelStatus.walkable) return false;

        const queue: Vector2[] = [new Vector2(x, y)];
        const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
        visited[x][y] = true;

        while (queue.length > 0) {
            const sVec: Vector2 = queue.shift()!;

            for (const dVec of AroundDir) {
                const nx = sVec.x + dVec.x;
                const ny = sVec.y + dVec.y;

                if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) {
                    return false; // Found border of the map -> not enclosed
                }
                
                const NextCheckPixel = mapData[nx][ny] instanceof PlayerData ? Player.OverlapPixel : mapData[nx][ny];
                if (NextCheckPixel.status == PixelStatus.walkable && !visited[nx][ny]) {
                    visited[nx][ny] = true;
                    queue.push(new Vector2(nx, ny));
                }
            }
        }
        return true;
    }

    const rows = mapData.length;
    const cols = mapData[0].length;

    const EnclosedVectors: Vector2[] = [];

    for(const dVec of AroundDir){
        const nx = x + dVec.x;
        const ny = y + dVec.y;

        if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) {
            continue;
        }

        const CheckedPixel = mapData[nx][ny] instanceof PlayerData ? Player.OverlapPixel : mapData[nx][ny];
        if(CheckedPixel.status == PixelStatus.walkable) {
            if(checkEnclosedSpace(nx, ny)){
                EnclosedVectors.push(new Vector2(nx, ny));
            }
        }
    }

    return EnclosedVectors;
}
const InteriorFillColor: rgb = new rgb(109, 76, 65);
async function fillInterior(x: number, y:number): Promise<void>{
    if(mapData[x][y].Indoors) return;
    if(mapData[x][y].status != PixelStatus.walkable) return;

    mapData[x][y].Indoors = true;
    InteriorFillVisual(x,y);

    await sleep(40);
    
    for(const dVec of AroundDir){
        fillInterior(x+dVec.x, y+dVec.y);
    }

    async function InteriorFillVisual(x: number, y:number): Promise<void>{
        const OriginalColor: rgb = mapData[x][y].color.new();

        const FillPixel = mapData[x][y] instanceof PlayerData ? Player.OverlapPixel : mapData[x][y];

        for(let i = 0; i < 1; i+= .1){
            FillPixel.color = FillPixel.color.Lerp(InteriorFillColor, i);
            await sleep(5);
        }
        await sleep(400);
        for(let i = 0; i < 1; i+= .05){
            FillPixel.color = FillPixel.color.Lerp(OriginalColor, i);
            await sleep(200);
        }
    }
}
function CheckDeleteInterior(x: number, y: number): void{
    const EnclosedSpaces: Vector2[] = GetEnclosedSpacesAround(x, y);

    for(const vec of AroundDir){
        if(EnclosedSpaces.find((v: Vector2) => v.x == x+vec.x && v.y == y+vec.y) == undefined){
            if(x+vec.x < 0 || x+vec.x >= mapData.length || y+vec.y < 0 || y+vec.y > mapData[0].length) continue;
            deleteInterior(x+vec.x, y+vec.y);
        }
    }
}
function deleteInterior(x: number,y: number): void{
    const InteriorPixel: PixelData = mapData[x][y] instanceof PlayerData ? Player.OverlapPixel : mapData[x][y];

    if(!InteriorPixel.Indoors) return;

    InteriorPixel.Indoors = false;

    let p: PixelData;
    for(const dVec of AroundDir){
        if(x+dVec.x < 0 || x+dVec.x >= mapData.length || y+dVec.y < 0 || y+dVec.y > mapData[0].length) continue;

        p = mapData[x+dVec.x][y+dVec.y] instanceof PlayerData ? Player.OverlapPixel : mapData[x+dVec.x][y+dVec.y];
        if(p .Indoors){
            deleteInterior(x+dVec.x, y+dVec.y);
        }
    }
}