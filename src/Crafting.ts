enum RecipeTriggerType{
    AlwaysDisplay,
    Furnace,
    LargeFurnace,
}
class Recipe{
    constructor(ResourceFrom: ResourceList, ResourceTo: ResourceTypes, AmountTo: number, TriggerBlocks: RecipeTriggerType){
        this.ResourceFrom = ResourceFrom;
        this.ResourceTo = [ResourceTo, AmountTo];
        this.TriggerBlocks = TriggerBlocks;
    }
    ResourceFrom: ResourceList;
    ResourceTo: [ResourceTypes, number];
    TriggerBlocks: RecipeTriggerType;
}
const AvalibleRecipes: Recipe[] = [];
class RecipeHandler{
    AllRecipes: Recipe[] = [
        new Recipe(new ResourceList().Add(ResourceTypes.sand, 3).Add(ResourceTypes.wood, 1), ResourceTypes.glass, 1, RecipeTriggerType.Furnace),
        new Recipe(new ResourceList().Add(ResourceTypes.iron, 4).Add(ResourceTypes.wood, 3), ResourceTypes.iron, 1, RecipeTriggerType.Furnace),
        new Recipe(new ResourceList().Add(ResourceTypes.sand, 20), ResourceTypes.glass, 10, RecipeTriggerType.LargeFurnace),
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
        //return;
        const RecipeElements: HTMLElement[] = [];
    
        this.AvalibleRecipes.forEach(recipe => {
            const button = document.createElement('button');
            if(Resources.HasResources(recipe.ResourceFrom)){
                const PosInArray = this.AllRecipes.indexOf(recipe);
                button.onclick = () => this.Craft(PosInArray);
            }else{
                button.id = "unavailable";
            }

            let ChildrenOfElement: HTMLElement[] = [];
            let WorkedElement: HTMLElement;
            const DivResourceFrom: HTMLElement = document.createElement('div');
            DivResourceFrom.classList.add("Ingredients-List");

            recipe.ResourceFrom.resources.forEach((resource) => {
                WorkedElement = document.createElement('p');
                WorkedElement.innerHTML = resource[1].toString();
                ChildrenOfElement.push(WorkedElement);
                WorkedElement = document.createElement('img');
                (WorkedElement as HTMLImageElement).src = "Icons/" +ResourceTypes[resource[0]]+ ".png";
                ChildrenOfElement.push(WorkedElement);
            })

            DivResourceFrom.replaceChildren(...ChildrenOfElement);
            ChildrenOfElement = [];

            
            const ArrowElement: HTMLImageElement = document.createElement('img');
            ArrowElement.src = "Icons/right-arrow.png";
            ArrowElement.classList.add("arrow");

            const DivResourceTo = document.createElement('div');
            DivResourceTo.classList.add("result");

            WorkedElement = document.createElement('p');
            WorkedElement.innerHTML = recipe.ResourceTo[1].toString();
            ChildrenOfElement.push(WorkedElement);
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/" +ResourceTypes[recipe.ResourceTo[0]]+ ".png";
            ChildrenOfElement.push(WorkedElement);
            DivResourceTo.replaceChildren(...ChildrenOfElement);
            ChildrenOfElement = [];

            button.replaceChildren(DivResourceFrom, ArrowElement, DivResourceTo);
            RecipeElements.push(button);
        });
    
        if(RecipeElements.length == 0) document.getElementsByClassName("Crafting-List")[0]!.replaceChildren(document.createElement('hr'));
        else document.getElementsByClassName("Crafting-List")[0]!.replaceChildren(...RecipeElements);
    }
    Craft(id: number){
        const CraftedRecipe = this.AllRecipes[id];
        Resources.RemoveResourceList(CraftedRecipe.ResourceFrom);
        Resources.AddResource(CraftedRecipe.ResourceTo[0], CraftedRecipe.ResourceTo[1]);
        this.DisplayAvalibleRecipes();
    }
}