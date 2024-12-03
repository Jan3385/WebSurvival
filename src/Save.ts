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

    // Save the world
    fetch('../web-files/saveWorld.php', {
        method: 'POST',
        body: JSON.stringify({
            worldName: worldName,
            password: password, // <- unsafe 🥶
            resources: save_resources,
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
function Load(Resource: string){
    //ResourceManager.ins.AddResource();
    const resourcePair = Resource.split("|");
    for(const pair of resourcePair){
        const resource = pair.split(":");
        if(resource.length > 1){
            ResourceManager.ins.AddResource(Number(resource[0]), Number(resource[1]));
        }
    }
}