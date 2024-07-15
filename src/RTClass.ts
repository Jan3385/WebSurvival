/**
 * Linear interpolation from a to b with t
 */
function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
}

//Class for rendering the game
class Renderer{
    /**
     * Creates a renderer object for the canvas
     * @constructor
     */
    constructor(){
        this.init();
        this.Draw();
    }
    /**
     * Initialises the canvas and fills it with perlin noise
     */
    init(): void{
        if(canvas.width % canvasScale != 0 || canvas.height % canvasScale != 0) 
            console.error('Canvas size is not divisible by scale');

        // 16 : 10 resolution
        for (let i = 0; i < 80; i++) {
            mapData[i] = [];
            for (let j = 0; j < 50; j++) {
                mapData[i][j] = PerlinPixel(i, j); 
            }
        }

        window.addEventListener('resize', this.UpdateWindowSize);

        this.UpdateWindowSize();

        console.log("initialised canvas with array of X:" + mapData.length + " Y:" + mapData[0].length);
    }
    renderLight: boolean = false;
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    
        ctx.beginPath(); //Clear ctx from prev. frame
        for (let i = 0; i < canvas.width/canvasScale; i++) {
            for (let j = 0; j < canvas.height/canvasScale; j++) {
                const pixel = mapData[i][j];

                if(!this.renderLight) ctx.fillStyle = pixel.color.getWithLight(pixel.Brightness);
                else ctx.fillStyle = "rgb(" + pixel.Brightness * 50 + "," + pixel.Brightness * 50 + "," + pixel.Brightness * 50 + ")";
                
                ctx.fillRect(i*canvasScale, j*canvasScale, canvasScale, canvasScale);
            }
        }
        this.DrawInteractIndicator();
        
        ctx.strokeStyle = Player.borderColor.getWithLight(Math.max(0.35,mapData[Player.x][Player.y].Brightness));
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x*canvasScale+1, Player.y*canvasScale+1, canvasScale-2, canvasScale-2);
    }
    DrawInteractIndicator(){
        if(canvasScale < 6) return;

        const ctx = canvas.getContext('2d')!;
        ctx.beginPath();
        for(let i = 0; i < mapData.length; i++){
            for(let j = 0; j < mapData[0].length; j++){
                const pixel = mapData[i][j];
                if(pixel.status == PixelStatus.interact) {
                    switch((<InteractData>pixel).highlight){
                        case _Highlight.none:
                            break;
                        case _Highlight.lightBorder:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 1;
                            ctx.strokeRect(i*canvasScale, j*canvasScale, canvasScale-1, canvasScale-1);
                            break;
                        case _Highlight.border:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i*canvasScale+1, j*canvasScale+1, canvasScale-2, canvasScale-2);
                            break;
                        case _Highlight.thickBorder:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 4;
                            ctx.strokeRect(i*canvasScale+2, j*canvasScale+2, canvasScale-4, canvasScale-4);
                            break;
                        case _Highlight.slash:
                            ctx.strokeStyle = interactCol.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i*canvasScale+1, j*canvasScale+1, canvasScale-2, canvasScale-2);
                            
                            ctx.moveTo(i*canvasScale+1, j*canvasScale+1);
                            ctx.lineTo(i*canvasScale+canvasScale-1, j*canvasScale+canvasScale-1);
                            break;
                    }
                }
            }
        }
        ctx.lineWidth = 2;
        ctx.stroke(); //write all the diagonal lines
    }
    /**
     * Updates the resource count on the screen
     */
    UpdateResourcesScreen(){
        document.getElementById("stone")!.innerHTML = ": "+Resources.stone;
        document.getElementById("wood")!.innerHTML = ": "+Resources.wood;
    }
    UpdateWindowSize(){
        canvasScale = Math.floor(window.innerWidth / 140);
        if(mapData[0].length * canvasScale > window.innerHeight*0.8) canvasScale = Math.floor(window.innerHeight*0.7 / mapData[0].length);

        canvas.width = mapData.length * canvasScale;
        canvas.height = mapData[0].length * canvasScale;
    }
}
//Class for terrain modification
class TerrainManipulator{
    /**
     * Inserts a pixel at the given position
     * @param {number} x 
     * @param {number} y 
     * @param {PixelData} PixelData 
     */
    ModifyMapData(x: number, y: number, PixelData: PixelData): void{
        mapData[x][y] = PixelData;
    }
    /**
     * 
     * @param {Array<Array<PixelData>>} NewMapData 
     * @returns 
     */
    InsertMapDataRaw(NewMapData: Array<Array<PixelData>>): void{
        if(mapData.length != NewMapData.length || mapData[0].length != NewMapData[0].length) {
            console.error('Map size is not matched');
            return;
        }

        mapData = NewMapData;
    }
    /**
     * Inserts a interactable pixel at the pixel inner position
     * @param {InteractData} Pixel 
     */
    InsertResourcePixel(Pixel: InteractData): void{
        Terrain.ModifyMapData(Pixel.x, Pixel.y, Pixel);

        switch(Pixel.interactType){
            case InteractType.stone:
                ResourceTerrain.stone++;
                break;
            case InteractType.wood:
                ResourceTerrain.wood++;
                break;
        }
    }
    /**
     * Deletes the interactable pixel at the given X,Y position
     * @param {number} pX 
     * @param {number} pY 
     * @throws {ReferenceError} No interactable type at that location
     */
    DeleteResourcePixel(pX: number, pY: number): void{
        if(mapData[pX][pY].status != PixelStatus.interact) throw new ReferenceError("No resource type at that location");

        switch((<InteractData>mapData[pX][pY]).interactType){
            case InteractType.stone:
                ResourceTerrain.stone--;
                break;
            case InteractType.wood:
                ResourceTerrain.wood--;
                break;
            default:
                throw new ReferenceError("Unknown resource type");
        }

        this.ModifyMapData(pX, pY,PerlinPixel(pX, pY));
    }
    /**
     * Clears the map and fills it with perlin noise
     */
    Clear(): void{
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < mapData.length; i++) {
            for (let j = 0; j < mapData[0].length; j++) {
                mapData[i][j] = PerlinPixel(i, j);
            }
        }
    }
    /**
     * Hadles safe player movement
     * @param {PlayerData} Player 
     * @param {Number} x 
     * @param {Number} y 
     */
    MovePlayer(Player: PlayerData, x: number, y: number): void{
        //if player is not building allow diagonal movement else only move non-diagonaly
        if(!isBuilding){
            Terrain.MovePlayerRaw(Player, MovementVector.x, 0);
            Terrain.MovePlayerRaw(Player, 0, MovementVector.y);
        }else{
            if(MovementVector.x != 0) MovementVector.y = 0;
            Terrain.MovePlayerRaw(Player, MovementVector.x, MovementVector.y);
        }
    }
    /**
     * Moves the given player by the X and Y amount
     * @param {PlayerData} Player 
     * @param {Number} x 
     * @param {Number} y 
     */
    MovePlayerRaw(Player: PlayerData, x: number, y: number): void{
        let mPixel: PixelData = mapData[Player.x + x][Player.y + y];
        //check if the player can move to the given position
        if(mPixel.status == PixelStatus.free || mPixel.status == PixelStatus.taken || 
         (mPixel.status == PixelStatus.interact && (<any>mPixel).walkStatus == PixelStatus.taken)){ // ??

            //move the player

            //if is player exiting a door, lock it
            if(Player.OverlapPixel.status == PixelStatus.interact && 
              (<InteractData>Player.OverlapPixel).interactType == InteractType.door && (x != 0 || y != 0)) {

                (<DoorData>Player.OverlapPixel).Close();
            }

            this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
            Player.x += x;
            Player.y += y;
            Player.OverlapPixel = mapData[Player.x][Player.y];
            this.ModifyMapData(Player.x, Player.y, new PixelData(Player.color));

        }else if(mPixel.status == PixelStatus.interact && (<InteractData>mPixel).interactType == InteractType.door){
            (<DoorData>mPixel).Open();
        }
    }
    /**
     * Forcefully moves the player to a given X and Y position (skips any checks)
     * @param {PlayerData} Player 
     * @param {number} x 
     * @param {number} y 
     */
    ForceMovePlayer(Player: PlayerData, x: number, y: number): void{
        this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
        Player.x += x;
        Player.y += y;
        Player.OverlapPixel = mapData[Player.x][Player.y];
        this.ModifyMapData(Player.x, Player.y, new PixelData(Player.color));
    }

    /**
     * Tries to generate a random resource on the map
     */
    GenerateRandomResource(): void{
        let rand = Math.random();
        const spawnArea = 12;

        let centerVec = {
            x: Math.floor(mapData.length / 2),
            y: Math.floor(mapData[0].length / 2),
        }
        let pX;
        let pY;

        //gets a position outside of spawn area
        do{
            pX = Math.floor((Math.random() * mapData.length- 2) + 1);
            pY = Math.floor((Math.random() * mapData[0].length -2) + 1);
        }while(((pX > centerVec.x-spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y-spawnArea && pY < centerVec.y + spawnArea)))

        if(rand < (ResourceTerrain.wood/ResourceTerrain.stone)/3) this.GenerateStone(pX, pY);
        else this.GenerateTree(pX, pY);
    }
    /**
     * Generates a tree at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateTree(x: number,y: number): void{
        if(ResourceTerrain.wood + 5 > MaxTResource.wood) return;

        //check if there is a space for the tree in a 3x3 grid
        for(let i = x-1; i <= x+1; i++){
            if(i < 0 || i > mapData.length) return;
            for(let j = y-1; j<=y+1; j++){
                if(j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.free) return;
            }
        }

        const tPixel: InteractData = new InteractData(new rgb(200, 70, 50), x, y, InteractType.wood);
        Terrain.InsertResourcePixel(tPixel);
        
        let lPixel = new InteractData(new rgb(49, 87, 44), x+1, y, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x-1, y, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x, y+1, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new InteractData(new rgb(49, 87, 44), x, y-1, InteractType.wood, 2);
        Terrain.InsertResourcePixel(lPixel);
    }
    /**
     * Generates a stone at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateStone(x: number,y: number): void{
        if(ResourceTerrain.stone + 5 > MaxTResource.stone) return;

        //check if stone can freely spawn in a 3x3 grid
        for(let i = x-1; i <= x+1; i++){
            if(i < 0 || i > mapData.length) return;
            for(let j = y-1; j<=y+1; j++){
                if(j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.free) return;
            }
        }

        let rPixel: InteractData;
        rPixel = new InteractData(new rgb(200, 200, 200), x, y, InteractType.stone);
        Terrain.InsertResourcePixel(rPixel);
        let sPixel = new InteractData(new rgb(200, 200, 200), x, y, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x+1, y, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x-1, y, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x, y+1, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new InteractData(new rgb(200, 200, 200), x, y-1, InteractType.stone);
        Terrain.InsertResourcePixel(sPixel);

        let stoneVec = {x: 1, y: 1}
        let repeats = Math.floor(Math.random()*3)+1;
        for(let i = 0; i < repeats; i++) {
            stoneVec.x = Math.floor(Math.random()*2)-1;
            stoneVec.y = Math.floor(Math.random()*2)-1;
            if(stoneVec.x == 0) stoneVec.x = 1;
            if(stoneVec.y == 0) stoneVec.y = 1;

            sPixel = new InteractData(new rgb(200, 200, 200), x+stoneVec.x, y+stoneVec.y, InteractType.stone);
            Terrain.InsertResourcePixel(sPixel);
        }
    }
}