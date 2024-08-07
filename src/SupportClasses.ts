class Vector2{
    x: number;
    y: number;
    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}
class rgb{
    /**
     * @constructor
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     */
    r: number;
    g: number;
    b: number;
    constructor(r: number,g: number,b: number){
        this.r = r;
        this.g = g;
        this.b = b;
    }
    new(): rgb{
        return new rgb(this.r, this.g, this.b);
    }
    newSlightlyRandom(val: number): rgb{
        return new rgb(this.r + Math.floor(Math.random()*val), 
                        this.g + Math.floor(Math.random()*val), 
                        this.b + Math.floor(Math.random()*val));
    }
    changeBy(val: number): rgb{
        return new rgb(this.r + val, 
                        this.g + val, 
                        this.b + val);
    }
    /**
    * Returns the rgb value in string format
    * @returns {string}
    */
    get(): string{
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
    }
    getWithLight(light: number): string{
        const lightShift = Math.min(light / 5, 1.1);
        return `rgb(${Math.floor(this.r * lightShift)},${Math.floor(this.g*lightShift)},${this.b*lightShift})`;
    }
    /**
     * Makes the rgb value darker by the value
     * @param {number} val 
     */
    Darken(val = 1.5): void{
        this.r /= val;
        this.g /= val;
        this.b /= val;
    }
    Lerp(other: rgb, t: number): rgb{
        return new rgb(
            Math.floor(lerp(this.r, other.r, t)),
            Math.floor(lerp(this.g, other.g, t)),
            Math.floor(lerp(this.b, other.b, t))
        );
    }
    MixWith(other: rgb, t: number): rgb{
        return new rgb(
            Math.floor(lerp(this.r, other.r, t)),
            Math.floor(lerp(this.g, other.g, t)),
            Math.floor(lerp(this.b, other.b, t))
        );
    }
}
/**
 * Linear interpolation from a to b with t
 */
function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
}

enum ResourceTypes{
    wood,
    stone,
    sand,
    glass,
    iron
}
class ResourceManager{
    resources: [ResourceTypes, number][] = [];
    DisplayStoredResources(): void{
        const ResouceElements: HTMLElement[] = [];
        this.resources.forEach(x => {
            const container = document.createElement('div');
            const image = document.createElement('img');
            const text = document.createElement('p');

            image.src = 'Icons/' + ResourceTypes[x[0]] + '.png';
            text.innerHTML = x[1].toString();
            container.appendChild(image);
            container.appendChild(text);
            ResouceElements.push(container);
        });

        document.getElementById("Player-Resources")!.replaceChildren(...ResouceElements);
    }
    DisplayCostResources(resources: ResourceList): void{
        const ResouceElements: HTMLElement[] = [];

        const text = document.createElement('p');
        text.classList.add('Cost-Build');
        text.innerHTML = "Cost:";
        ResouceElements.push(text);

        resources.resources.forEach(x => {
            const container = document.createElement('p');
            container.innerHTML = '<img src="Icons/' + ResourceTypes[x[0]] +'.png">: ' + x[1];
            ResouceElements.push(container);
        });

        document.getElementsByClassName("Cost-List")[0]!.replaceChildren(...ResouceElements);
    }
    Cheat(){
        this.AddResourceList(new ResourceList()
            .Add(ResourceTypes.wood, 1000)
            .Add(ResourceTypes.stone, 1000)
            .Add(ResourceTypes.glass, 1000));
    }
    GetResourceAmount(type: ResourceTypes): number{
        const resource = this.resources.filter(x => x[0] == type)[0];
        if(resource == undefined) return 0;
        return resource[1];
    }
    AddResource(type: ResourceTypes, amount: number): void{
        const resource = this.resources.filter(x => x[0] == type)[0];
        if(resource == undefined) this.resources.push([type, amount]);
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
            return false;
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