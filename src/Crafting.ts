enum RecipeTriggerType{
    AlwaysDisplay,
    Furnace,
    LargeFurnace,
}
class Recipe{
    constructor(ResourceFrom: ResourceTypes, AmountFrom: number, ResourceTo: ResourceTypes, AmountTo: number, TriggerBlocks: RecipeTriggerType){
        this.ResourceFrom = [ResourceFrom, AmountFrom];
        this.ResourceTo = [ResourceTo, AmountTo];
        this.TriggerBlocks = TriggerBlocks;
    }
    ResourceFrom: [ResourceTypes, number];
    ResourceTo: [ResourceTypes, number];
    TriggerBlocks: RecipeTriggerType;
}
const AvalibleRecipes: Recipe[] = [];
class RecipeHandler{
    AllRecipes: Recipe[] = [
        new Recipe(ResourceTypes.wood, 2, ResourceTypes.stone, 1, RecipeTriggerType.Furnace),
        new Recipe(ResourceTypes.sand, 7, ResourceTypes.glass, 1, RecipeTriggerType.Furnace),
        new Recipe(ResourceTypes.iron, 1, ResourceTypes.stone, 5, RecipeTriggerType.Furnace),
        new Recipe(ResourceTypes.sand, 25, ResourceTypes.glass, 5, RecipeTriggerType.LargeFurnace),
        new Recipe(ResourceTypes.wood, 10, ResourceTypes.stone, 6, RecipeTriggerType.LargeFurnace),
    ];
    AvalibleRecipes: Recipe[] = [];
    UpdatevAvalibleRecipes(){
        this.AvalibleRecipes = [];
        let UsedFurnaceRecipes: boolean = false;
        let UsedLargeFurnaceRecipes: boolean = false;

        const PlayerPos: Vector2 = new Vector2(Player.x, Player.y);
        AroundDir.forEach(dir => {
            const Tile = mapData[PlayerPos.x + dir.x][PlayerPos.y + dir.y];
            if(Tile instanceof BuildingData){
                if(Tile.name == "Furnace" && !UsedFurnaceRecipes){
                    this.AvalibleRecipes.push(...this.AllRecipes.filter(x => x.TriggerBlocks == RecipeTriggerType.Furnace));
                    UsedFurnaceRecipes = true;
                }
                if(Tile.name == "Large Furnace" && !UsedLargeFurnaceRecipes){
                    this.AvalibleRecipes.push(...this.AllRecipes.filter(x => x.TriggerBlocks == RecipeTriggerType.LargeFurnace));
                    UsedLargeFurnaceRecipes = true;
                }
            }
        });
        this.AvalibleRecipes.push(...this.AllRecipes.filter(x => x.TriggerBlocks == RecipeTriggerType.AlwaysDisplay));

        this.DisplayAvalibleRecipes();
    }
    DisplayAvalibleRecipes(){
        const RecipeElements: HTMLElement[] = [];
    
        this.AvalibleRecipes.forEach(recipe => {
            const button = document.createElement('button');
            if(Resources.HasResources(new ResourceList().Add(recipe.ResourceFrom[0], recipe.ResourceFrom[1]))){
                const PosInArray = this.AllRecipes.indexOf(recipe);
                button.onclick = () => this.Craft(PosInArray);
            }else{
                button.id = "unavailable";
            }

            const ButtonChildren: HTMLElement[] = [];
            let WorkedElement: HTMLElement;
            WorkedElement = document.createElement('p');
            WorkedElement.innerHTML = recipe.ResourceFrom[1].toString();
            ButtonChildren.push(WorkedElement);
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/" +ResourceTypes[recipe.ResourceFrom[0]]+ ".png";
            ButtonChildren.push(WorkedElement);
            
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/right-arrow.png";
            WorkedElement.classList.add("arrow");
            ButtonChildren.push(WorkedElement);

            WorkedElement = document.createElement('p');
            WorkedElement.innerHTML = recipe.ResourceTo[1].toString();
            ButtonChildren.push(WorkedElement);
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/" +ResourceTypes[recipe.ResourceTo[0]]+ ".png";
            ButtonChildren.push(WorkedElement);

            button.replaceChildren(...ButtonChildren);
            RecipeElements.push(button);
        });
    
        if(RecipeElements.length == 0) document.getElementsByClassName("Crafting-List")[0]!.replaceChildren(document.createElement('hr'));
        else document.getElementsByClassName("Crafting-List")[0]!.replaceChildren(...RecipeElements);
    }
    Craft(id: number){
        const CraftedRecipe = this.AllRecipes[id];
        Resources.RemoveResource(CraftedRecipe.ResourceFrom[0], CraftedRecipe.ResourceFrom[1]);
        Resources.AddResource(CraftedRecipe.ResourceTo[0], CraftedRecipe.ResourceTo[1]);
        this.DisplayAvalibleRecipes();
    }
}