function clamp(min: number, max: number, value: number): number{
    return Math.min(max, Math.max(min, value));
}

class GameTime{
    /**
     * Creates a time object
     * @constructor
     */
    time: number = 0;
    maxTime: number = 1000; //default: 1000
    lightLevel: number = 5;
    minLightLevel: number = 30;
    triggeredNight: boolean = false;
    triggeredDay: boolean = false;
    constructor(){
        this.time = this.maxTime * 0.4;
    }
    /**
     * Updates the time object
     */
    Tick(){
        this.time++;
        if(this.time % 1 == 0) CalculateLightMap();

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

        document.body.style.background = "rgb(" + lerp(99, 255, t) + "," + 
            lerp(110, 255, t) + "," + lerp(114, 255, t) + ")";
        
    }

    OnNightStart(){
        if(this.triggeredNight) return;
        //spawns enemies
        this.triggeredNight = true;
    }
    OnDayStart(){
        if(this.triggeredDay) return;

        this.triggeredDay = true;

        //heals buildings
        for(let i = 0; i < mapData.length; i++){
            for(let j = 0; j < mapData[0].length; j++){
                if(mapData[i][j] instanceof BuildingData){
                    (<BuildingData>mapData[i][j]).FullyHeal();
                }
            }
        }
    }
    GetDayProgress(): number{
        return this.time / this.maxTime;
    }
}

function BlocksLight(pixel: InteractData): boolean{
    if(pixel.interactType == InteractType.wall) return true;
    if(pixel.interactType == InteractType.stone) return true;
    if(pixel.interactType == InteractType.wood) return true;
    if(pixel.interactType == InteractType.door && !(<DoorData>pixel).isOpen) return true;

    return false;
}
class LightData extends BuildingData{
    intensity: number = 0;
    radius: number = 0;

    constructor(color: rgb, x: number, y: number,
        hp: number = 4, intensity: number = 2, radius: number = 3
        ){
        super(color, x, y, PixelStatus.interact, hp, _Highlight.thickBorder, InteractType.light);
        if(intensity > 7) console.error("Light intensity is too high: " + intensity);
        this.intensity = intensity;
        this.radius = radius;
    }
    at(x: number,y: number){
        return new LightData(this.color, x, y, this.maxHealh, this.intensity, this.radius);
    }
}
function castRay(
    sX: number, sY: number,
    angle: number,
    intensity: number,
    radius: number
): void{
    let x = sX;
    let y = sY;
    
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for(let i = 0; i < radius; i++){
        x += dx;
        y += dy;
        const ix = Math.floor(x);
        const iy = Math.floor(y);

        if(ix < 0 || ix >= mapData.length || iy < 0 || iy >= mapData[0].length) break;

        const distance = Math.sqrt((ix - sX) ** 2 + (iy - sY) ** 2);
        const lightIntensity = Math.max(0, intensity - distance);
        mapData[ix][iy].Brightness = Math.max(lightIntensity, mapData[ix][iy].Brightness);

        //blocks light
        if(mapData[ix][iy].status == PixelStatus.interact){
            const pixel = <InteractData>mapData[ix][iy];
            if(BlocksLight(pixel)) break;
        }
    }
}
function castSunRay( // cestuje a pokud něco najde, tak se na chvili vypne pro iluzi stinu
    sX: number, sY: number,
    angle: number,
    intensity: number
): void{
    const constIntensity: number = intensity;
    let ShadowTravel: number = 0;
    let x = sX;
    let y = sY;
    
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for(let i = 0; true; i++){
        x += dx;
        y += dy;
        const ix = Math.floor(x);
        const iy = Math.floor(y);

        if(ix < 0 || ix >= mapData.length || iy < 0 || iy >= mapData[0].length) break;

        if(ShadowTravel == 0) intensity = constIntensity;

        mapData[ix][iy].Brightness = clamp(intensity, 5, mapData[ix][iy].Brightness);

        //blocks light 
        if(mapData[ix][iy].status == PixelStatus.interact){
            const pixel = <InteractData>mapData[ix][iy];
            if(BlocksLight(pixel)){
                ShadowTravel = 4;
                intensity = constIntensity-2;
            };
        }
        if(ShadowTravel > 0){
            ShadowTravel--;
        }
    }
}

function CalculateLightMap(){
    const numRays: number = 72;

    let lightSources: LightData[] = [];

    for(let i = 0; i < mapData.length; i++){
        for(let j = 0; j < mapData[0].length; j++){
            mapData[i][j].Brightness = 0;
            if(mapData[i][j] instanceof LightData) lightSources.push(<LightData>mapData[i][j]);
        }
    }

    for(const light of lightSources){
        for(let i = 0; i < numRays; i++){
            const angle = (Math.PI * 2 / numRays) * i;
            castRay(light.x, light.y, angle, light.intensity, light.radius);
        }
    }

    //sun
    const sunAngle = (Math.floor(Math.PI * gTime.GetDayProgress() * 100 / 5) / 100) * 5;
    for(let i = 0; i < mapData[0].length; i++){
        castSunRay(0, i, sunAngle, gTime.lightLevel);
        castSunRay(mapData.length, i, sunAngle, gTime.lightLevel);
    }
    for(let i = 0; i < mapData.length; i++){
        castSunRay(i, 0, sunAngle, gTime.lightLevel);
    }

    //player emits a little light
    for(let i = 0; i < numRays; i++){
        const angle = (Math.PI * 2 / numRays) * i;
        castRay(Player.x, Player.y, angle, 2, 2);
    }

}