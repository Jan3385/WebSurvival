
class Recipe{
    constructor(){

    }
}
class RecipeHandler{
    AvalibleRecipes: Recipe[] = [];
    UpdatevAvalibleRecipes(){
    
    }
    DisplayAvalibleRecipes(){
        const RecipeElements: HTMLElement[] = [];
    
        this.AvalibleRecipes.forEach(x => {
            const button = document.createElement('button');
            button.onclick = () =>{
                this.Craft(1);
            }
            const ButtonChildren: HTMLElement[] = [];
            let WorkedElement: HTMLElement;
            WorkedElement = document.createElement('p');
            WorkedElement.innerHTML = "10";
            ButtonChildren.push(WorkedElement);
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/wood.png";
            ButtonChildren.push(WorkedElement);
            
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/right-arrow.png";
            WorkedElement.classList.add("arrow");
            ButtonChildren.push(WorkedElement);

            WorkedElement = document.createElement('p');
            WorkedElement.innerHTML = "10";
            ButtonChildren.push(WorkedElement);
            WorkedElement = document.createElement('img');
            (WorkedElement as HTMLImageElement).src = "Icons/wood.png";
            ButtonChildren.push(WorkedElement);
            /*const container = document.createElement('p');
            container.innerHTML = '<img src="Icons/' + ResourceTypes[x[0]] +'.png">: ' + x[1];
            ResouceElements.push(container);*/
        });
    
        document.getElementsByClassName("Crafting-List")[0]!.replaceChildren(...RecipeElements);
    }
    Craft(number: number){
    
    }
}