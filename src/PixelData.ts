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
    free,
    taken,
    block,
    interact,
};
enum _Highlight{
    none,
    lightBorder,
    border,
    thickBorder,
    slash,
}
class PixelData{
    /**
     * Stores data about the given pixel
     * @param {number} color 
     * @param {PixelStatus} status 
     */
    color: rgb;
    status: PixelStatus;
    Brightness: number = 0;
    constructor(color: rgb, status: PixelStatus = PixelStatus.free){
        this.color = color;
        this.status = status;
    }
}
/**
 * Given a X and Y position returns a predictable pixel using perlin noise
 * @param {number} x 
 * @param {number} y 
 * @returns {PixelData} 
 */
function PerlinPixel(x: number,y: number): PixelData{
    const pColor = Perlin.perlinColorTerrain(x/9,y/9);
    return new PixelData(new rgb(pColor.r, pColor.g, pColor.b), pColor.s);
}
const EmptyPixel: PixelData = new PixelData(new rgb(147, 200, 0));

class PlayerData extends PixelData{
    /**
     * Creates a player object with the given colors at the given position
     * @param {rgb} color 
     * @param {rgb} borderColor 
     * @param {number} x 
     * @param {number} y 
     */
    borderColor: rgb;
    x: number;
    y: number;
    OverlapPixel: PixelData;
    constructor(color: rgb, borderColor: rgb, x: number, y: number){
        super(color, PixelStatus.block);
        this.borderColor = borderColor;
        this.x = x;
        this.y = y;
        this.OverlapPixel = PerlinPixel(x, y);
    }
}
enum InteractType{
    stone,
    wood,
    door,
    wall,
    floor,
    light,
};

class InteractData extends PixelData{
    /**
     * Construct a interactable pixel with the given color at the given position
     * @param {rgb} color 
     * @param {number} x 
     * @param {number} y 
     * @param {InteractType} type 
     * @param {number} [hp=6]
     */
    x: number;
    y: number;
    interactType: InteractType;
    health: number;
    highlight: _Highlight;
    constructor(color: rgb, x: number, y: number, type: InteractType, hp: number = 6, highlight: _Highlight = _Highlight.border){
        super(color, PixelStatus.interact);
        this.x = x;
        this.y = y;
        this.interactType = type;
        this.health = hp;
        this.highlight = highlight;
    }
    /**
     * Damages the interactable pixel, return true if it was destroyed (on final hit)
     * @returns {boolean} 
     */
    Damage(): boolean{
        this.health--;
        this.color.Darken(1.2);
        if(this.health <= 0) {
            Terrain.DeleteInteractPixel(this.x, this.y);
            return true;
        }
        return false;
    }
}

class BuildingData extends InteractData{
    /**
     * @constructor
     * @param {rgb} color 
     * @param {number} x 
     * @param {number} y 
     * @param {PixelStatus} walkStatus 
     * @param {number} hp 
     * @param {_Highlight} highlight
     * @param {InteractType} interactionType
     */
    walkStatus: PixelStatus;
    maxHealh: number;
    defaultColor: rgb;
    highlight: _Highlight;
    constructor(color: rgb, x: number, y: number, walkStatus: PixelStatus, hp: number = 12, highlight: _Highlight = _Highlight.border, interactionType: InteractType){
        super(color, x, y, interactionType, hp);
        this.maxHealh = hp;
        this.defaultColor = color.new();
        this.walkStatus = walkStatus
        this.highlight = highlight;
    }
    /**
     * Returns this object at the specified coordinates
     * @param {number} x 
     * @param {number} y 
     * @returns {ThisType}
     */
    at(x: number,y: number): BuildingData{
        return new BuildingData(this.defaultColor.newSlightlyRandom(30), x, y, this.walkStatus, this.maxHealh, this.highlight, this.interactType);
    }
    Damage(): boolean{
        this.health--;
        this.color.Darken(1.07);
        if(this.health <= 0) {
            Terrain.ModifyMapData(this.x, this.y, PerlinPixel(this.x, this.y));
            return true;
        }
        return false;
    }
    DamageNoDelete(){
        this.health--;
        this.color.Darken(1.07);
        if(this.health <= 0) {
            return true;
        }
        return false;
    }
    FullyHeal(){
        this.health = this.maxHealh;
        this.color = this.defaultColor;
    }
}
class DoorData extends BuildingData{
    /**
     * @constructor
     * @param {rgb} color 
     * @param {number} x 
     * @param {number} y 
     * @param {PixelStatus} walkStatus 
     * @param {number} hp 
     * @param {_Highlight} highlight
     * @param {InteractType} interactionType
     */
    isOpen: boolean;
    constructor(color: rgb, x: number, y: number, walkStatus: PixelStatus, hp: number = 12, highlight: _Highlight = _Highlight.border, interactionType: InteractType){
        super(color, x, y, walkStatus, hp, highlight, interactionType);
        this.isOpen = false;
    }
    at(x: number,y: number){
        return new DoorData(this.defaultColor.newSlightlyRandom(30), x, y, this.walkStatus, this.maxHealh, this.highlight, this.interactType);
    }
    Open(){
        if(this.isOpen) return;

        this.walkStatus = PixelStatus.taken;
        this.color = this.color.changeBy(-30);
        this.highlight = _Highlight.lightBorder;
        this.isOpen = true;
    }
    Close(){
        if(!this.isOpen) return;

        this.walkStatus = PixelStatus.block;
        this.color = this.color.changeBy(+30);
        this.highlight = _Highlight.slash;
        this.isOpen = false;
    }
}
let interactCol = new rgb(60, 60, 60);