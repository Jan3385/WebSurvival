class GameTime{
    /**
     * Creates a time object
     * @constructor
     */
    time: number = 0;
    maxTime: number = 1000;
    lightLevel: number = 100;
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
        if(this.GetDayProgress() < 0.2){
            this.lightLevel = Math.max(this.minLightLevel, this.GetDayProgress() * 500);
        }else if(this.GetDayProgress() < 0.3){
            this.OnDayStart();
            this.lightLevel = 100;
        }
        else if(this.GetDayProgress() > 0.8){
            if(this.GetDayProgress() > 0.9) this.OnNightStart();

            this.lightLevel = Math.max(this.minLightLevel, 100 - (this.GetDayProgress() - 0.8) * 500);
            if(this.GetDayProgress() >= 1) this.time = 0;
        }else{
            this.triggeredDay = false;
            this.triggeredNight = false;
        }

        //from 30 - 100 to 0 - 1
        const t = ((this.lightLevel-30)*(100/70)) /100;

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
class LightData extends BuildingData{
    intensity: number = 0;
    radius: number = 0;

    constructor(color: rgb, x: number, y: number,
        hp: number = 4, intensity: number = 2, radius: number = 3
        ){
        super(color, x, y, PixelStatus.interact, hp, _Highlight.thickBorder, InteractType.light);
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

        //blocks light
        if(mapData[ix][iy].status == PixelStatus.block) break;
        if(mapData[ix][iy].status == PixelStatus.interact){
            const pixel = <InteractData>mapData[ix][iy];
            if(pixel.interactType == InteractType.wall) break;
            if(pixel.interactType == InteractType.stone) break;
            if(pixel.interactType == InteractType.wood) break;
            if(pixel.interactType == InteractType.door && !(<DoorData>pixel).isOpen) break;
        }

        const distance = Math.sqrt((ix - sX) ** 2 + (iy - sY) ** 2);
        const lightIntensity = Math.max(0, intensity - distance);
        mapData[ix][iy].Brightness = Math.max(mapData[ix][iy].Brightness, lightIntensity);
    }
}

function CalculateLightMap(){
    console.log("Calculating light map");
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
}