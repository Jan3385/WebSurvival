/// <reference path="PixelData.ts" />
/// <reference path="Lighting.ts" />

let buildButtons: NodeListOf<HTMLElement> = document.getElementsByClassName("Selection-Button-Div")[0].querySelectorAll("button");
const BuildType = {
    Wall: 0,
    Floor: 1,
}
let Building = [
    {   //cheap wall
        build: new BuildingData(new rgb(244, 211, 94), 1, 1, PixelStatus.block, 3, _Highlight.border, InteractType.wall),
        cost: {stone: 0, wood: 3},
        label: "Cheap Wall - cheap but weak"
    },
    {   //wooden wall
        build: new BuildingData(new rgb(127, 79, 36), 1, 1, PixelStatus.block, 12, _Highlight.border, InteractType.wall),
        cost: {stone: 0, wood: 10},
        label: "Wooden Wall - stronger but more expensive"
    },
    {   //stone wall
        build: new BuildingData(new rgb(85, 85, 85), 1, 1, PixelStatus.block, 24, _Highlight.border, InteractType.wall),
        cost: {stone: 15, wood: 2},
        label: "Stone Wall - strong but expensive"
    },
    {   //cheap floor
        build: new BuildingData(new rgb(255, 243, 176), 1, 1, PixelStatus.taken, 1, _Highlight.none, InteractType.floor),
        cost: {stone: 0, wood: 1},
        label: "Cheap Floor - not the prettiest"
    },
    {   //wooden floor
        build: new BuildingData(new rgb(175, 164, 126), 1, 1, PixelStatus.taken, 3, _Highlight.none, InteractType.floor),
        cost: {stone: 0, wood: 2},
        label: "Wooden Floor - decent looking"
    },
    {   //stone floor
        build: new BuildingData(new rgb(206, 212, 218), 1, 1, PixelStatus.taken, 6, _Highlight.none, InteractType.floor),
        cost: {stone: 2, wood: 0},
        label: "Stone Floor - build with unforseen quality"
    },
    {   //cheap door
        build: new DoorData(new rgb(255, 231, 230), 1, 1, PixelStatus.block, 3, _Highlight.slash, InteractType.door),
        cost: {stone: 0, wood: 10},
        label: "Cheap Door - gets you thru the night"
    },
    {   //wooden door
        build: new DoorData(new rgb(200, 180, 166), 1, 1, PixelStatus.block, 12, _Highlight.slash, InteractType.door),
        cost: {stone: 0, wood: 20},
        label: "Wooden Door - Feels like home"
    },
    {   //stone door
        build: new DoorData(new rgb(200, 200, 200), 1, 1, PixelStatus.block, 24, _Highlight.slash, InteractType.door),
        cost: {stone: 25, wood: 2},
        label: "Stone Door - a door that will last"
    },
    {   //torch
        build: new LightData(new rgb(255, 255, 0), 1, 1, 4, 5, 5),
        cost: {stone: 2, wood: 25},
        label: "Torch - lights up the night, burns out by sunrise"
    },
];

let SelectedBuilding = Building[0];
document.getElementById("Selected-Building-Label")!.innerHTML = SelectedBuilding.label;
document.getElementById("C-Wood")!.innerHTML = '<img src="Icons/wood.png">: ' + SelectedBuilding.cost.wood;
document.getElementById("C-Stone")!.innerHTML = '<img src="Icons/stone.png">: ' + SelectedBuilding.cost.stone;

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
function cheat(){
    Resources.stone += 1000;
    Resources.wood += 1000;
    Render.UpdateResourcesScreen();
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
    document.getElementById("Selected-Building-Label")!.innerHTML = SelectedBuilding.label;
    //update cost display
    document.getElementById("C-Wood")!.innerHTML = '<img src="Icons/wood.png">: ' + SelectedBuilding.cost.wood;
    document.getElementById("C-Stone")!.innerHTML = '<img src="Icons/stone.png">: ' + SelectedBuilding.cost.stone;
}