declare let worldName: string;
declare let password: string;

function Save(){
    console.log("Saving wolrd "+ worldName);

    let save_resources = "";
    for(const key of Object.values(ResourceTypes)){
        if(!isNaN(Number(key))){
            const resource_type = key as ResourceTypes;
            save_resources += key + ":" + ResourceManager.ins.GetResourceAmount(resource_type).toString() + "|";
        }
    }
    save_resources += "\n";

    let save_player_data = QuestManager.PlayerLevel + "|" + QuestManager.PlayerXP + 
        "|" + QuestManager.PlayerXpToNextLevel + "|" + QuestManager.ins.activeQuestId + "|" + Player.Health + 
        "|" + GameTime.ins.time + "|" + Player.x + "|" + Player.y  + "|\n";

    let wolrd_data: string[] = [];
    for(let x = 0; x < Terrain.ins.mapData.length; x++){
        for(let y = 0; y < Terrain.ins.mapData[x].length; y++){
            let tile = Terrain.ins.mapData[x][y];
            let tileInfo = "";

            if(tile instanceof ResourceData){
                tileInfo += tile.ResourceID + "|";
            }else if (tile instanceof BuildingData){
                tileInfo += tile.name;
                if(tile.OverlaidPixel instanceof BuildingData){
                    tileInfo += "#" + tile.OverlaidPixel.name;
                }
                tileInfo += "|";
            }

            if(tile.Indoors) tileInfo += tileInfo === "" ? "|1|" : "1|";
            else if(tileInfo != "") tileInfo += "0|";

            if(tileInfo != ""){
                wolrd_data.push(x + "#" + y + "|" + tileInfo);
            }
        }
    }
    // Save the world
    fetch('web-files/non-viewable/saveWorld.php', {
        method: 'POST',
        body: JSON.stringify({
            worldName: worldName,
            password: password, // <- unsafe 🥶
            resources: save_resources,
            playerData: save_player_data,
            worldData: wolrd_data,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        },
        }).then(response => {
            if(response.ok){
                console.log("World saved..");
        }else{
            response.text().then(text => { console.error("ERROR WITH SAVING WORLD:\n"+text); });
        }});
}
function Load(Resource: string, PlayerData: string, WorldData: string[] | boolean[]){
    if(Resource == "" || PlayerData == "") return;

    const resourcePair = Resource.split("|");
    for(const pair of resourcePair){
        const resource = pair.split(":");
        if(resource.length > 1){
            ResourceManager.ins.AddResourceNoQuest(Number(resource[0]), Number(resource[1]));
        }
    }

    const playerData = PlayerData.split("|");
    QuestManager.PlayerLevel = Number(playerData[0]);
    QuestManager.PlayerXP = Number(playerData[1]);
    QuestManager.PlayerXpToNextLevel = Number(playerData[2]);
    QuestManager.ins.activeQuestId = Number(playerData[3]);
    QuestManager.ins.UpdateQuestProgress(0);
    QuestManager.ins.UpdateLevelDisplay();
    Player.SetHP(Number(playerData[4]));
    GameTime.ins.time = Number(playerData[5]);
    Player.OverlapPixel = Terrain.ins.mapData[Number(playerData[6])][Number(playerData[7])];
    Player.x = Number(playerData[6]);
    Player.y = Number(playerData[7]);
    Terrain.ins.MovePlayer(Player); //Draw player

    WorldData.forEach(element => {
        if(element == false) return; //end line
        element = element as string;

        //load variables
        const coordinates = element.split("|")[0].split("#");
        const x = Number(coordinates[0]);
        const y = Number(coordinates[1]);
        const tileInfo = element.split("|")[1].split("#");
        let tile: string = "";
        let overlapTile: string = "";
        const isIndoors = element.split("|")[2] == "1";

        if(tileInfo.length >= 1) tile = tileInfo[0];
        if(tileInfo.length >= 2) overlapTile = tileInfo[1];

        if(tile.length == 0){ //place nothing, set indoors
            Terrain.ins.mapData[x][y].Indoors = isIndoors;
            return;
        }
        else if(tile.length == 1){ //Place resource
            switch(tile){
                case "w":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateTreePixel(x,y,true));
                    break;
                case "l":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateTreePixel(x,y,false));
                    break;
                case "s":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateStonePixel(x,y, false));
                    break;
                case "i":
                    Terrain.ins.InsertResourcePixel(Terrain.ins.GenerateStonePixel(x,y, true));
                    break;
            }
            return;
        }

        //Place building
        const tileData = FindBuilding(tile).at(x, y);

        if(tileData == null) return;
        if(overlapTile != ""){
            const overlapTileData = FindBuilding(overlapTile).at(x, y);
            if(overlapTileData == null) return;
            tileData.OverlaidPixel = overlapTileData;
        }
        tileData.Indoors = isIndoors;
        PlaceBuildingNoCheck(tileData);
    });
};
function SaveAndExit(){
    Save();
    window.location.href = "../web-files/login.php";
}