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

    let save_player_data = QuestManager.PlayerLevel + "|" + QuestManager.PlayerXP + "|" + QuestManager.PlayerXpToNextLevel + "|" + QuestManager.ins.activeQuestId + "|" + Player.Health + "|" + GameTime.ins.time + "|\n";


    // Save the world
    fetch('../web-files/saveWorld.php', {
        method: 'POST',
        body: JSON.stringify({
            worldName: worldName,
            password: password, // <- unsafe 🥶
            resources: save_resources,
            playerData: save_player_data,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        },
        }).then(response => {
            if(response.ok){
                console.log("World saved");
        }else{
            response.text().then(text => { console.log(text); });
        }});
}
function Load(Resource: string, PlayerData: string){
    if(Resource == "" || PlayerData == "") return;

    const resourcePair = Resource.split("|");
    for(const pair of resourcePair){
        const resource = pair.split(":");
        if(resource.length > 1){
            ResourceManager.ins.AddResource(Number(resource[0]), Number(resource[1]));
        }
    }

    const playerData = PlayerData.split("|");
    QuestManager.PlayerLevel = Number(playerData[0]);
    QuestManager.PlayerXP = Number(playerData[1]);
    QuestManager.PlayerXpToNextLevel = Number(playerData[2]);
    QuestManager.ins.activeQuestId = Number(playerData[3]);
    QuestManager.ins.UpdateDisplayQuest();
    QuestManager.ins.UpdateLevelDisplay();
    Player.SetHP(Number(playerData[4]));
    GameTime.ins.time = Number(playerData[5]);
};