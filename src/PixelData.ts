/// <reference path="SupportClasses.ts" />
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
const nullPixel = new TerrainData(new rgb(0,0,0), PixelStatus.walkable, TerrainType.water);
function PerlinPixel(x: number,y: number): PixelData{
    const pColor = Terrain.perlin.perlinColorTerrain(x/9,y/9);
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
    respawnTime: number = 0;
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
    Heal(heal: number){
        this.Health = Math.min(this.Health + heal, this.MaxHealth);
        document.getElementById("Health")!.innerHTML = "HP: " + this.Health.toString().padStart(2, "0");
    }
    FindAndSetSpawnPos(){
        let pos: Vector2 = new Vector2(Math.floor(canvas.width/canvasScale/2), Math.floor(canvas.height/canvasScale/2));

        //find a valid spawn position
        while(Terrain.ins.mapData[pos.x][pos.y].status != PixelStatus.walkable){
            pos.x += Math.floor(Math.random() * 3) - 1;
            pos.y += Math.floor(Math.random() * 3) - 1;
            if(pos.x < 0 || pos.x >= Terrain.ins.MapX()) pos.x = Math.floor(canvas.width/canvasScale/2);
            if(pos.y < 0 || pos.y >= Terrain.ins.MapY()) pos.y = Math.floor(canvas.height/canvasScale/2);

            pos = new Vector2(pos.x + Math.floor(Math.random() * 3) - 1, pos.y + Math.floor(Math.random() * 3) - 1);
        }
        Terrain.ins.mapData[Player.x][Player.y] = this.OverlapPixel;

        this.x = pos.x;
        this.y = pos.y;

        this.OverlapPixel = Terrain.ins.mapData[this.x][this.y];
        Terrain.ins.mapData[Player.x][Player.y] = this;
    }
    Die(): void{
        //On death.. respawn and loose half of the resources
        console.log('Player has died.. respawning');

        ResourceManager.ins.resources.forEach(resource => {
            ResourceManager.ins.RemoveResource(resource[0], Math.ceil(resource[1]/2));
        });

        this.respawnTime = 5;
        this.Heal(this.MaxHealth/2);

        //despawn all enemies
        EnemyList.forEach(e => e.Despawn());

        this.FindAndSetSpawnPos();
    }
    public MoveBy(x: number, y: number){
        const moveTile = Terrain.ins.mapData[Player.x + x][Player.y + y];

        //mine resources
        if(moveTile instanceof ResourceData){
            moveTile.Damage(1);
        }
        //break buildings
        else if(moveTile instanceof BuildingData && moveTile.status == PixelStatus.breakable){
            if(IsDamageable(moveTile)) (<IDamageable>moveTile).Damage(1);
            RecipeHandler.ins.UpdatevAvalibleRecipes();
        }
        //interact (ex. doors)
        else if(IsInteractable(moveTile) && moveTile.status == PixelStatus.interact) (<IInteractable>moveTile).Interact();
        //attack enemy
        else if(moveTile instanceof EnemyData) moveTile.Damage(1);
        //move to a spot
        else if(!(x == 0 && y == 0)){
            Terrain.ins.MovePlayer(Player, x, y);
            RecipeHandler.ins.UpdatevAvalibleRecipes();
        }
    }
}
class ResourceData extends PixelData implements IDamageable, IHighlightable{
    Health: number;
    MaxHealth: number;
    x: number;
    y: number;
    Highlight: HighlightPixel;
    HighlightColor: rgb = new rgb(60, 60, 60);
    DefaultColor: rgb;
    ResourceType: ResourceTypes;
    OverlaidPixel: PixelData;
    OnResourceDestroy: () => void;
    constructor(
        color: rgb, status: PixelStatus, Health: number, x: number, y: number,
        Highlight: HighlightPixel, ResourceType: ResourceTypes, OverlaidPixel: PixelData ,OnResourceDestroy: () => void
    ){
        super(color, status);
        this.DefaultColor = color.new();
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
        this.color = this.DefaultColor.Lerp(this.DefaultColor.Darker(), 1-this.Health/this.MaxHealth);
        if(this.Health <= 0){
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy(): void {
        Terrain.ins.DeleteResourcePixel(this.x, this.y, this.OverlaidPixel);
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
    HighlightColor: rgb;
    DefaultColor: rgb;
    name: string;
    OverlaidPixel: PixelData = new TerrainData(new rgb(0,0,0), PixelStatus.walkable, TerrainType.ground);
    constructor(
        name: string, color: rgb, status: PixelStatus, Health: number, x: number, y: number,
        Highlight: HighlightPixel, HighlightColor: rgb = new rgb(80, 80, 80)
    ){
        super(color, status);
        this.name = name;
        this.Health = Health;
        this.MaxHealth = Health;
        this.x = x;
        this.y = y;
        this.Highlight = Highlight;
        this.DefaultColor = color.new();
        this.HighlightColor = HighlightColor;
    }
    Damage(damage: number): boolean{
        this.Health -= damage;
        this.color = this.DefaultColor.Lerp(this.DefaultColor.Darker(), 1-this.Health/this.MaxHealth);
        if(this.Health <= 0){
            this.Destroy();
            return true;
        }
        return false;
    }
    Destroy(): void {
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlaidPixel);
        CheckDeleteInterior(this.x, this.y);
    }
    DamageNoDestroy(damage: number): boolean{
        this.Health -= damage;
        this.color = this.DefaultColor.Lerp(this.DefaultColor.Darker(), 1-this.Health/this.MaxHealth);
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
        const build = new BuildingData(this.name, this.DefaultColor.newSlightlyRandom(30), this.status, this.MaxHealth ,x, y, this.Highlight, this.HighlightColor);
        if(Player.x == x && Player.y == y) build.OverlaidPixel = Player.OverlapPixel;
        else build.OverlaidPixel = Terrain.ins.mapData[x][y];
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
        else door.OverlaidPixel = Terrain.ins.mapData[x][y];
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
class GlassData extends BuildingData{
    constructor(name: string, color: rgb, x: number, y: number, hp: number = 3){
        super(name, color, PixelStatus.breakable, hp, x, y, HighlightPixel.lightBorder);
    }
    at(x: number,y: number){
        const glass = new GlassData(this.name, this.DefaultColor.newSlightlyRandom(30), x, y, this.MaxHealth);
        if(Player.x == x && Player.y == y) glass.OverlaidPixel = Player.OverlapPixel;
        else glass.OverlaidPixel = Terrain.ins.mapData[x][y];
        return glass;
    }
}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}