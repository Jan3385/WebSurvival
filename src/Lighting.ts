function clamp(min: number, max: number, value: number): number{
    return Math.min(max, Math.max(min, value));
}

class GameTime{
    public static ins: GameTime;
    /**
     * Creates a time object
     * @constructor
     */
    time: number = 0;
    day: number = 0;
    maxTime: number = 1000; //default: 1000
    lightLevel: number = 5;
    minLightLevel: number = 30;
    triggeredNight: boolean = false;
    triggeredDay: boolean = false;
    constructor(){
        this.time = this.maxTime * 0.25;
    }
    /**
     * Updates the time object
     */
    Tick(){
        //if(QuestManager.ins.activeQuestId > 2) might be dumb
        this.time++;

        if(this.GetDayProgress() <= 0.2){ //day starts (sun rises)
            this.lightLevel = this.GetDayProgress() * 25;
        }
        else if(this.GetDayProgress() <= 0.3){ //day function triggeres and sun brightness is maxxed
            this.OnDayStart();
            this.lightLevel = 5;
        }
        else if(this.GetDayProgress() >= 0.7){ // night begins (sun sets)

            //after 80% of the day/night cycle toggle full darkness
            if(this.GetDayProgress() >= 0.8){
                this.OnNightStart();
                this.lightLevel = 0;

                //reset day at midnight
                if(this.GetDayProgress() >= 1) this.time = 0;
            }else{
                // Day progress: 0.7 -> 0.8
                //light level: 5 -> 0
                this.lightLevel = 5 - ((this.GetDayProgress()-0.7) * 50);
            }
        }
        else{ // middle of the day
            this.triggeredDay = false;
            this.triggeredNight = false;
        }

        //from 0 - 5 to 0 - 1
        const t = this.lightLevel / 5;

        document.documentElement.style.setProperty('--light-level', t.toString());

        document.getElementById("Time")!.innerHTML = GameTime.ins.GetDayTime(); //shows time

        CalculateLightMap();
    }

    OnNightStart(){
        if(this.triggeredNight) return;
        
        this.triggeredNight = true;

        //dont spawn enemies on first two quests
        if(QuestManager.ins.activeQuestId < 2) return;

        let numOfEnemies = Math.min(4, Math.max(1, Math.floor(Math.random() * (this.day / 10) + 1)));
        if(this.SpawnRaidEnemies()) numOfEnemies += 1;
        this.SpawnEnemies(numOfEnemies);
    }
    SpawnEnemies(amount: number){
        let SpawnedEnemies: number = 0;
        let iteration = 0;
        while(SpawnedEnemies < amount && iteration < 70 && EnemyList.length < 5){
            iteration++;

            //generate a random position on the edge of the map
            let x: number = Math.random() < 0.5 ? (Math.random() < 0.5 ? 0 : Terrain.ins.MapX()-1) : Math.floor(Math.random() * (Terrain.ins.MapX()-1)) + 1;
            let y: number;
            if (x === 0 || x === Terrain.ins.MapX()-1) y = Math.floor(Math.random() * Terrain.ins.MapY());
            else y = Math.random() < 0.5 ? 0 : Terrain.ins.MapY()-1;

            if(GameTime.CanSpawEnemyAt(x, y)){
                new EnemyData(new rgb(214, 40, 40), new rgb(245, 124, 0), x, y, 2); //create enemy - automatically adds itself to EnemyList
                SpawnedEnemies++;
            }

        }
    }
    private static CanSpawEnemyAt(x: number,y: number): boolean{
        if(x < 0 || x >= Terrain.ins.MapX() || y < 0 || y >= Terrain.ins.MapY()) return false;
        if(Terrain.ins.mapData[x][y].status != PixelStatus.walkable) return false;
        if(Terrain.ins.mapData[x][y].Indoors) return false;
        if(Terrain.ins.mapData[x][y] instanceof BuildingData) return false;
        //if(Terrain.ins.mapData[x][y].Brightness > 1.5) return false;
        return true;
    }
    public SpawnRaidEnemies(){
        return this.day % 5 == 0 && this.day > 0;
    }
    OnDayStart(){
        if(this.triggeredDay) return;

        this.triggeredDay = true;

        //heals buildings and deletes all torches
        for(let i = 0; i < Terrain.ins.MapX(); i++){
            for(let j = 0; j < Terrain.ins.MapY(); j++){
                if(Terrain.ins.mapData[i][j] instanceof BuildingData){
                    (<BuildingData>Terrain.ins.mapData[i][j]).FullyHeal();

                    if((<BuildingData>Terrain.ins.mapData[i][j]).name == "Torch")
                        (<LightData>Terrain.ins.mapData[i][j]).BurnOut();
                }
                else if(Terrain.ins.mapData[i][j] instanceof EnemyData)
                    (<EnemyData>Terrain.ins.mapData[i][j]).Die();
            }
        }

        this.day++;
        const raidMessage = this.day%5 == 0 ? "Raid day!" : `${5-this.day%5} Day(s) until raid`;
        document.getElementById("Game-Day")!.innerHTML = `Day ${this.day} <span>| ${raidMessage}</span>`;
    }
    GetDayProgress(): number{
        return this.time / this.maxTime;
    }
    GetDayTime(): string{
        let hours = Math.floor(this.GetDayProgress() * 24);
        const minutes = Math.floor(((this.GetDayProgress() * 24 - hours) * 60)/15)*15;

        //3 hours offset
        hours = hours + 3;
        if(hours >= 24) hours -= 24;

        return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
    }
}

function BlocksLight(pixel: PixelData): boolean{
    if(pixel instanceof BuildingData){
        if(pixel instanceof LightData) return false;
        if(pixel instanceof GlassData) return false;
        if(pixel.status == PixelStatus.block) return true;
        if(pixel.status == PixelStatus.breakable) return true;
        if(pixel.status == PixelStatus.interact) return true;
    }
    if(pixel instanceof ResourceData) return true;

    return false;
}
class LightData extends BuildingData{
    intensity: number = 0;
    radius: number = 0;
    HighlightColor: rgb = new rgb(253, 203, 110);
    constructor(name: string, color: rgb, x: number, y: number,
        hp: number = 4, intensity: number = 2, radius: number = 3
        ){
        super(name, color, PixelStatus.breakable, hp, x, y, HighlightPixel.thickBorder);
        if(intensity > 7) console.error("Light intensity is too high: " + intensity);
        this.intensity = intensity;
        this.radius = radius;
    }
    at(x: number,y: number){
        const light = new LightData(this.name, this.color, x, y, this.MaxHealth, this.intensity, this.radius);
        if(Player.x == x && Player.y == y) light.OverlaidPixel = Player.OverlapPixel;
        else light.OverlaidPixel = Terrain.ins.mapData[x][y];
        return light;
    }
    BurnOut(){
        this.OverlaidPixel.Indoors = this.Indoors;
        Terrain.ins.ModifyMapData(this.x, this.y, this.OverlaidPixel);
    }
}
function castRay(
    sX: number, sY: number,
    angle: number,
    intensity: number,
    radius: number
): void{
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);

    //movement with angle for small deviations
    let x = sX - (dx/100);
    let y = sY - (dy/100);

    let distance = 0;
    for(let i = 0; distance <= radius; i++){
        x += dx*.5;
        y += dy*.5;
        const ix = Math.round(x);
        const iy = Math.round(y);

        //stop the light out of bounds
        if(ix < 0 || ix >= Terrain.ins.MapX() || iy < 0 || iy >= Terrain.ins.MapY()) break;

        distance = Math.sqrt((ix - sX) ** 2 + (iy - sY) ** 2);
        const lightIntensity = Math.max(0, intensity - distance);
        Terrain.ins.mapData[ix][iy].Brightness = Math.max(lightIntensity, Terrain.ins.mapData[ix][iy].Brightness);

        //reflects light
        if(BlocksLight(Terrain.ins.mapData[ix][iy])){
            return;
            /* refraction sucks :(
            if(true){ //flip along Y - idk fix TODO: try again ?
                hitNormal.y *= -1;
                angle = Math.atan2(hitNormal.y, hitNormal.x);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }else{ //flip along X
                hitNormal.x *= -1;
                angle = Math.atan2(hitNormal.y, hitNormal.x);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }
            Render.DrawGizmoLine(new Vector2(x,y), new Vector2(x + dx, y + dy));
            */
        }
    }
}
function castSunRay(
    sX: number, sY: number,
    angle: number,
    intensity: number
): void{
    const constIntensity: number = intensity;
    let ShadowTravel: number = 0;
    let HitBuilding: boolean = false;
    let x = sX;
    let y = sY;
    
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for(let i = 0; true; i++){
        x += dx*.5;
        y += dy*.5;
        const ix = Math.floor(x);
        const iy = Math.floor(y);

        if(ix < 0 || ix >= Terrain.ins.MapX() || iy < 0 || iy >= Terrain.ins.MapY()) break;

        if(ShadowTravel == 0) intensity = constIntensity;

        //indoor light is very dim
        if(!Terrain.ins.mapData[ix][iy].Indoors) Terrain.ins.mapData[ix][iy].Brightness = clamp(Terrain.ins.mapData[ix][iy].Brightness, 5, intensity);
        else{
            if(HitBuilding) Terrain.ins.mapData[ix][iy].Brightness = clamp(Terrain.ins.mapData[ix][iy].Brightness, Math.max(Terrain.ins.mapData[ix][iy].Brightness, 3), constIntensity/1.5);
            else Terrain.ins.mapData[ix][iy].Brightness = clamp(Terrain.ins.mapData[ix][iy].Brightness, 5, intensity);
        }

        //blocks light 
        if(BlocksLight(Terrain.ins.mapData[ix][iy])){
            if(Terrain.ins.mapData[ix][iy] instanceof BuildingData) HitBuilding = true;
            ShadowTravel = 6;
            intensity = constIntensity/1.4;
        };
        if(ShadowTravel > 0){
            ShadowTravel--;
        }
    }
}

function CalculateLightMap(){
    const numRays: number = 72;

    let lightSources: LightData[] = [];

    Terrain.ins.IterateMap((pixel, x, y) => {
        pixel.Brightness = 0;
        if(pixel instanceof LightData) lightSources.push(<LightData>pixel);
    });

    for(const light of lightSources){
        for(let i = 0; i < numRays; i++){
            const angle = (Math.PI * 2 / numRays) * i;
            //send ray from the middle of the block
            castRay(light.x, light.y, angle, light.intensity, light.radius);
        }
    }

    //sun
    const sunAngle = (Math.floor(Math.PI * GameTime.ins.GetDayProgress() * 100 / 5) / 100) * 5;
    for(let i = 0; i < Terrain.ins.MapY(); i++){
        castSunRay(0, i, sunAngle, GameTime.ins.lightLevel);
        castSunRay(Terrain.ins.MapX(), i, sunAngle, GameTime.ins.lightLevel);
    }
    for(let i = 0; i < Terrain.ins.MapX(); i++){
        castSunRay(i, 0, sunAngle, GameTime.ins.lightLevel);
    }

    //player emits a little light
    for(let i = 0; i < (numRays/2); i++){
        const angle = (Math.PI * 2 / (numRays/2)) * i;
        castRay(Player.x+.1, Player.y+.1, angle, 2, 2);
    }

}