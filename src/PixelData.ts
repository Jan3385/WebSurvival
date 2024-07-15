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
        let lightShift = Math.min(light / 5, 1.1);
        return 'rgb(' + Math.floor(this.r * lightShift) + ',' + Math.floor(this.g*lightShift) + ',' + Math.floor(this.b*lightShift) + ')';
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
}

enum PixelStatus{
    walkable,
    breakable,
    block,
    interact,
};
enum HighlightPixel{
    none,
    lightBorder,
    border,
    thickBorder,
    slash,
};

class PixelData{
    color: rgb;
    status: PixelStatus;
    Brightness: number = 0;
    constructor(color: rgb, status: PixelStatus = PixelStatus.walkable){
        this.color = color;
        this.status = status;
    }
}

function PerlinPixel(x: number,y: number): PixelData{
    const pColor = Perlin.perlinColorTerrain(x/9,y/9);
    return new PixelData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s);
}

interface IDamageable{
    Health: number;
    MaxHealth: number;
    /**
     * Damaged the Pixel, returns true if the pixel is destroyed
     */
    Damage(damage: number): boolean;
}
interface IHighlightable{
    Highlight: HighlightPixel;
}
function IsDamageable(entity: any): entity is IDamageable{
    return entity.Damage !== undefined;
}
function IsHighlightable(entity: any): entity is IHighlightable{
    return entity.Highlight !== undefined;
}

abstract class EntityData extends PixelData implements IDamageable, IHighlightable{
    x: number;
    y: number;
    BorderColor: rgb;
    Highlight: HighlightPixel = HighlightPixel.border;
    OverlapPixel: PixelData;
    Health: number;
    MaxHealth: number;
    constructor(
        color: rgb, status: PixelStatus = PixelStatus.walkable,
        x: number, y: number, BorderColor: rgb, EntityHealth: number
    ){
        super(color, status);
        this.x = x;
        this.y = y;
        this.BorderColor = BorderColor;
        this.Health = EntityHealth;
        this.OverlapPixel = PerlinPixel(x, y);
        this.MaxHealth = this.Health;
    }
    abstract Die(): void;

    Damage(damage: number): boolean{
        this.Health -= damage;
        if(this.Health <= 0){
            this.Die();
            return true;
        }
        return false;
    }
}

class PlayerData extends EntityData{
    constructor(color: rgb, borderColor: rgb, x: number, y: number, Health:number){
        super(color, PixelStatus.block, x, y, borderColor, Health);
    }
    Die(): void{
        console.log('Player has died, GAME OVER');
    }
}
class EnemyData extends EntityData{
    constructor(color: rgb, borderColor: rgb, x: number, y: number, EntityHealth:number){
        super(color, PixelStatus.breakable, x, y, borderColor, EntityHealth);
    }
    Die(): void{
        console.log('Enemy has died');
        mapData[this.x][this.y] = this.OverlapPixel;
    }
}
enum ResourceType{
    wood,
    stone,
}
class ResourceData extends PixelData implements IDamageable, IHighlightable{
    Health: number;
    MaxHealth: number;
    x: number;
    y: number;
    Highlight: HighlightPixel;
    ResourceType: ResourceType;
    OnResourceDestroy: () => void;
    constructor(
        color: rgb, status: PixelStatus, Health: number, x: number, y: number,
        Highlight: HighlightPixel, ResourceType: ResourceType ,OnResourceDestroy: () => void
    ){
        super(color, status);
        this.Health = Health;
        this.MaxHealth = Health;
        this.x = x;
        this.y = y;
        this.Highlight = Highlight;
        this.ResourceType = ResourceType;
        this.OnResourceDestroy = OnResourceDestroy;
    }
    Damage(damage: number): boolean{
        this.Health -= damage;
        this.color.Darken(1.2);
        if(this.Health <= 0){
            Terrain.DeleteResourcePixel(this.x, this.y);
            this.OnResourceDestroy();
            return true;
        }
        return false;
    }
}
class BuildingData extends PixelData implements IDamageable, IHighlightable{
    Health: number;
    MaxHealth: number;
    x: number;
    y: number;
    Highlight: HighlightPixel;
    DefaultColor: rgb;
    name: string;
    constructor(
        name: string, color: rgb, status: PixelStatus, Health: number, x: number, y: number,
        Highlight: HighlightPixel
    ){
        super(color, status);
        this.name = name;
        this.Health = Health;
        this.MaxHealth = Health;
        this.x = x;
        this.y = y;
        this.Highlight = Highlight;
        this.DefaultColor = color.new();
    }
    Damage(damage: number): boolean{
        this.Health -= damage;
        this.color.Darken(1.07); //TODO: update the Darken method and execution
        if(this.Health <= 0){
            Terrain.ModifyMapData(this.x, this.y, PerlinPixel(this.x, this.y));
            return true;
        }
        return false;
    }
    DamageNoDestroy(damage: number): boolean{
        this.Health -= damage;
        this.color.Darken(1.07);
        if(this.Health <= 0){
            return true;
        }
        return false;
    }
    /**
     * Returns this object at the specified coordinates
     * @param {number} x 
     * @param {number} y 
     * @returns {ThisType}
     */
    at(x: number,y: number): BuildingData{
        return new BuildingData(this.name, this.DefaultColor.newSlightlyRandom(30), this.status, this.MaxHealth ,x, y, this.Highlight);
    }
    FullyHeal(){
        this.Health = this.MaxHealth;
        this.color = this.DefaultColor.new();
    }
}
interface IInteractable{
    Interact(): void;
}
function IsInteractable(entity: any): entity is IInteractable{
    return entity.Interact !== undefined;
}
class DoorData extends BuildingData implements IInteractable{
    isOpen: boolean;
    constructor(
        name:string, color: rgb, x: number, y: number, hp: number = 12, 
        highlight: HighlightPixel = HighlightPixel.slash
    ){
        super(name, color, PixelStatus.interact, hp, x, y, highlight);
        this.isOpen = false;
    }
    at(x: number,y: number){
        return new DoorData(this.name, this.DefaultColor.newSlightlyRandom(30), x, y, this.MaxHealth, this.Highlight);
    }
    Interact(): void {
        if(this.isOpen) this.Close();
        else this.Open();
    }
    Open(){
        if(this.isOpen) return;

        this.status = PixelStatus.walkable;
        this.color = this.color.changeBy(-30);
        this.Highlight = HighlightPixel.lightBorder;
        this.isOpen = true;
    }
    Close(){
        if(!this.isOpen) return;

        this.status = PixelStatus.interact;
        this.color = this.color.changeBy(+30);
        this.Highlight = HighlightPixel.slash;
        this.isOpen = false;
    }
}
let interactCol = new rgb(60, 60, 60);