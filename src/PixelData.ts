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

abstract class PixelData{
    color: rgb;
    status: PixelStatus;
    Brightness: number = 0;
    Indoors: boolean = false;
    constructor(color: rgb, status: PixelStatus = PixelStatus.walkable){
        this.color = color;
        this.status = status;
    }
}
enum TerrainType{
    ground,
    sand,
    water,
}
class TerrainData extends PixelData{
    type: TerrainType;
    constructor(color: rgb, status: PixelStatus, type: TerrainType){
        super(color, status);
        this.type = type;
    }

}
function PerlinPixel(x: number,y: number): PixelData{
    const pColor = Perlin.perlinColorTerrain(x/9,y/9);
    return new TerrainData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s, pColor.t);
}

interface IDamageable{
    Health: number;
    MaxHealth: number;
    /**
     * Damaged the Pixel, returns true if the pixel is destroyed
     */
    Damage(damage: number): boolean;
    Destroy(): void;
}
interface IHighlightable{
    Highlight: HighlightPixel;
    HighlightColor: rgb;
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
    HighlightColor: rgb;
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
        this.HighlightColor = BorderColor;
        this.Health = EntityHealth;
        this.OverlapPixel = PerlinPixel(x, y);
        this.MaxHealth = this.Health;
    }
    abstract Die(): void;

    Damage(damage: number): boolean{
        this.Health -= Math.min(damage, this.Health);
        if(this.Health <= 0){
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy(): void {
        this.Die();
    }
}

class PlayerData extends EntityData{
    constructor(color: rgb, HighlightColor: rgb, x: number, y: number, Health:number){
        super(color, PixelStatus.block, x, y, HighlightColor, Health);
    }
    override Damage(damage: number): boolean {
        this.Health -= Math.min(damage, this.Health);

        document.getElementById("Health")!.innerHTML = "HP: " + this.Health.toString().padStart(2, "0");

        if(this.Health <= 0){
            this.Die();
            return true;
        }
        return false;
    }
    Die(): void{
        console.log('Player has died, GAME OVER');

        //have to change both colors
        this.color = new rgb(255, 0, 0);
        mapData[this.x][this.y].color = new rgb(255, 0, 0);
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
    HighlightColor: rgb = new rgb(60, 60, 60);
    ResourceType: ResourceType;
    OverlaidPixel: PixelData;
    OnResourceDestroy: () => void;
    constructor(
        color: rgb, status: PixelStatus, Health: number, x: number, y: number,
        Highlight: HighlightPixel, ResourceType: ResourceType, OverlaidPixel: PixelData ,OnResourceDestroy: () => void
    ){
        super(color, status);
        this.Health = Health;
        this.MaxHealth = Health;
        this.x = x;
        this.y = y;
        this.Highlight = Highlight;
        this.ResourceType = ResourceType;
        this.OverlaidPixel = OverlaidPixel;
        this.OnResourceDestroy = OnResourceDestroy;
    }
    Damage(damage: number): boolean{
        this.Health -= damage;
        this.color.Darken(1.2);
        if(this.Health <= 0){
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy(): void {
        Terrain.DeleteResourcePixel(this.x, this.y, this.OverlaidPixel);
        this.OnResourceDestroy();

        CheckDeleteInterior(this.x, this.y);
    }
}
class BuildingData extends PixelData implements IDamageable, IHighlightable{
    Health: number;
    MaxHealth: number;
    x: number;
    y: number;
    Highlight: HighlightPixel;
    HighlightColor: rgb = new rgb(60, 60, 60);
    DefaultColor: rgb;
    name: string;
    OverlaidPixel: PixelData = new TerrainData(new rgb(0,0,0), PixelStatus.walkable, TerrainType.ground);
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
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy(): void {
        Terrain.ModifyMapData(this.x, this.y, this.OverlaidPixel);
        CheckDeleteInterior(this.x, this.y);
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
        const build = new BuildingData(this.name, this.DefaultColor.newSlightlyRandom(30), this.status, this.MaxHealth ,x, y, this.Highlight);
        if(Player.x == x && Player.y == y) build.OverlaidPixel = Player.OverlapPixel;
        else build.OverlaidPixel = mapData[x][y];
        return build;
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
    HighlightColor: rgb = new rgb(60, 60, 60);
    constructor(
        name:string, color: rgb, x: number, y: number, hp: number = 12, 
        highlight: HighlightPixel = HighlightPixel.slash
    ){
        super(name, color, PixelStatus.interact, hp, x, y, highlight);
        this.isOpen = false;
    }
    at(x: number,y: number){
        const door = new DoorData(this.name, this.DefaultColor.newSlightlyRandom(30), x, y, this.MaxHealth, this.Highlight);
        if(Player.x == x && Player.y == y) door.OverlaidPixel = Player.OverlapPixel;
        else door.OverlaidPixel = mapData[x][y];
        return door;
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
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}