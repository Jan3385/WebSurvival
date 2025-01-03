enum ResourceTypes{
    sand,
    wood,
    stone,
    glass,
    iron_ore,
    iron,
    human_meat,
}
class ResourceManager{
    public static ins: ResourceManager;
    resources: [ResourceTypes, number][] = [];
    DisplayStoredResources(): void{
        const ResouceElements: HTMLElement[] = [];

        this.resources.sort((a, b) => a[0] - b[0]);

        this.resources.forEach(x => {
            const container = document.createElement('div');
            if(x[0] == ResourceTypes.human_meat){
                container.classList.add('Clickable-Resource');
                container.onclick = () => {
                    if(this.RemoveResource(ResourceTypes.human_meat, 1)) Player.Heal(1);
                }
            }

            const image = document.createElement('img');
            const text = document.createElement('p');

            image.src = '../Icons/' + ResourceTypes[x[0]] + '.png';
            image.title = ResourceTypes[x[0]].toString().replace('_',' ');
            text.innerHTML = x[1].toString().padStart(4, "0");
            container.appendChild(image);
            container.appendChild(text);
            ResouceElements.push(container);
        });
        
        if(ResouceElements.length == 0) document.getElementById("resources")!.replaceChildren(document.createElement('hr'));
        else document.getElementById("resources")!.replaceChildren(...ResouceElements);

        RecipeHandler.ins.DisplayAvalibleRecipes();
    }
    DisplayCostResources(resources: ResourceList): void{
        const ResouceElements: HTMLElement[] = [];

        const text = document.createElement('p');
        text.classList.add('Cost-Build');
        text.innerHTML = "Cost:";
        ResouceElements.push(text);

        resources.resources.forEach(x => {
            const container = document.createElement('p');
            container.innerHTML = 
                '<img src="../Icons/' +ResourceTypes[x[0]]+'.png" title="'+ResourceTypes[x[0]].toString().replace('_',' ')+'">: ' + x[1];
            
            ResouceElements.push(container);
        });

        document.getElementsByClassName("Cost-List")[0]!.replaceChildren(...ResouceElements);
    }
    Cheat(){
        this.AddResourceList(new ResourceList()
            .Add(ResourceTypes.wood, 1000)
            .Add(ResourceTypes.stone, 1000)
            .Add(ResourceTypes.glass, 1000)
            .Add(ResourceTypes.iron, 1000)
            .Add(ResourceTypes.human_meat, 10));
    }
    GetResourceAmount(type: ResourceTypes): number{
        const resource = this.resources.filter(x => x[0] == type)[0];
        if(resource == undefined) return 0;
        return resource[1];
    }
    AddResource(type: ResourceTypes, amount: number): void{
        const resource = this.resources.filter(x => x[0] == type)[0];
        if(resource == undefined) {
            if(amount <= 0) return;
            this.resources.push([type, amount]);
        }
        else this.resources.filter(x => x[0] == type)[0][1] += amount;
        this.DisplayStoredResources();

        //Quests:
        if(QuestManager.ins.GetActiveQuest() instanceof ResourceQuest){
            const quest = <ResourceQuest>QuestManager.ins.GetActiveQuest();
            quest.CheckCompleteQuest(type, amount);
        }
    }
    AddResourceNoQuest(type: ResourceTypes, amount: number): void{
        const resource = this.resources.filter(x => x[0] == type)[0];
        if(resource == undefined) {
            if(amount <= 0) return;
            this.resources.push([type, amount]);
        }
        else this.resources.filter(x => x[0] == type)[0][1] += amount;
        this.DisplayStoredResources();
    }
    AddResourceList(list: ResourceList): void{
        list.resources.forEach(x => this.AddResource(x[0], x[1]));
    }
    RemoveResource(type: ResourceTypes, amount: number): boolean{
        const resource = this.resources.filter(x => x[0] == type)[0];

        if(resource == undefined) return false;
        else this.resources.filter(x => x[0] == type)[0][1] -= amount;

        if(this.resources.filter(x => x[0] == type)[0][1] <= 0){
            const resourceIndex = this.resources.findIndex(x => x[0] == type);
            this.resources.splice(resourceIndex, 1);
            this.DisplayStoredResources();
            return true;
        }

        this.DisplayStoredResources();
        return true;
    }
    RemoveResourceList(list: ResourceList): boolean{
        let RemovedSuccesfully: boolean = true;

        for(let i = 0; i < list.resources.length; i++){
            if(!this.RemoveResource(list.resources[i][0], list.resources[i][1])) RemovedSuccesfully = false;
        }

        return RemovedSuccesfully;
    }
    HasResources(list: ResourceList): boolean{
        for(let i = 0; i < list.resources.length; i++){
            if(this.GetResourceAmount(list.resources[i][0]) < list.resources[i][1]) return false;
        }
        return true;
    }
}
class ResourceList{
    resources: [ResourceTypes, number][] = [];
    Add(type: ResourceTypes, amount: number): ResourceList{
        const resourceIndex = this.resources.findIndex(x => x[0] == type);
        if(resourceIndex != -1) this.resources[resourceIndex][1] += amount;
        else this.resources.push([type, amount]);

        return this;
    }
    Remove(type: ResourceTypes, amount: number): ResourceList{
        const resourceIndex = this.resources.findIndex(x => x[0] == type);
        if(resourceIndex != -1) this.resources[resourceIndex][1] -= amount;
        else console.log("Tried to remove non-existant resource from ResourceList");
        return this;
    }
    GetResourceAmount(type: ResourceTypes): number{
        const resource = this.resources.filter(x => x[0] == type)[0];
        if(resource == undefined) return 0;
        return resource[1];
    }
}