//Class for terrain modification

/// <reference path="PixelData.ts" />

class Terrain{
    public static ins: Terrain;

    public static perlin: PerlinNoise;

    mapData: PixelData[][] = [];

    constructor(Seed: number){
        Terrain.perlin = new PerlinNoise(Seed);

        // 16 : 10 resolution | 80x50 pixel map
        for (let i = 0; i < 80; i++) {
            this.mapData[i] = [];
            for (let j = 0; j < 50; j++) {
                this.mapData[i][j] = PerlinPixel(i, j);
            }
        }
    }
    /**
     * Inserts a pixel at the given position
     * @param {number} x 
     * @param {number} y 
     * @param {PixelData} PixelData 
     */
    ModifyMapData(x: number, y: number, PixelData: PixelData): void{
        this.mapData[x][y] = PixelData;
    }
    //returns the width of the map in number of objects
    MapX(): number{
        return this.mapData.length;
    }
    //returns the height of the map in number of objects
    MapY(): number{
        return this.mapData[0].length;
    }
    IterateMap(callback: (pixel: PixelData, x: number, y: number) => void): void{
        for(let i = 0; i < this.mapData.length; i++){
            for(let j = 0; j < this.mapData[0].length; j++){
                callback(this.mapData[i][j], i, j);
            }
        }
    }
    /**
     * 
     * @param {Array<Array<PixelData>>} NewMapData 
     * @returns 
     */
    InsertMapDataRaw(NewMapData: Array<Array<PixelData>>): void{
        if(this.mapData.length != NewMapData.length || this.mapData[0].length != NewMapData[0].length) {
            console.error('Map size is not matched');
            return;
        }

        this.mapData = NewMapData;
    }
    /**
     * Inserts a interactable pixel at the pixel inner position
     * @param {InteractData} Pixel 
     */
    InsertResourcePixel(Pixel: ResourceData): void{
        this.ModifyMapData(Pixel.x, Pixel.y, Pixel);

        ResourceTerrain.Add(Pixel.ResourceType, 1);
    }
    /**
     * Deletes the interactable pixel at the given X,Y position
     * @param {number} pX 
     * @param {number} pY 
     * @throws {ReferenceError} No interactable type at that location
     */
    DeleteResourcePixel(pX: number, pY: number, replacement: PixelData): void{
        ResourceTerrain.Remove((<ResourceData>this.mapData[pX][pY]).ResourceType, 1);

        this.ModifyMapData(pX, pY, replacement);
    }
    /**
     * Clears the map and fills it with perlin noise
     */
    Clear(): void{
        this.IterateMap((pixel, x, y) => {
            pixel = PerlinPixel(x, y);
        });
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
            this.MovePlayerRaw(Player, MovementVector.x, 0);
            this.MovePlayerRaw(Player, 0, MovementVector.y);
        }else{
            if(MovementVector.x != 0) MovementVector.y = 0;
            this.MovePlayerRaw(Player, MovementVector.x, MovementVector.y);
        }
    }
    /**
     * Moves the given player by the X and Y amount
     * @param {PlayerData} Player 
     * @param {Number} x 
     * @param {Number} y 
     */
    MovePlayerRaw(Player: PlayerData, x: number, y: number): void{
        let mPixel: PixelData = this.mapData[Player.x + x][Player.y + y];
        //check if the player can move to the given position
        if(mPixel.status == PixelStatus.walkable){

            //if is player exiting a door, lock it
            if(mPixel instanceof DoorData) mPixel.Close();

            this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
            Player.x += x;
            Player.y += y;
            Player.OverlapPixel = this.mapData[Player.x][Player.y];
            this.ModifyMapData(Player.x, Player.y, new PlayerData(Player.color, Player.HighlightColor, Player.x, Player.y, Player.Health));

        }else if(mPixel.status == PixelStatus.interact && mPixel instanceof DoorData){
            mPixel.Open();
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
        Player.OverlapPixel = this.mapData[Player.x][Player.y];
        this.ModifyMapData(Player.x, Player.y, new PlayerData(Player.color, Player.HighlightColor, Player.x, Player.y, Player.Health));
    }

    /**
     * Tries to generate a random resource on the map
     */
    GenerateRandomResource(): void{
        let rand = Math.random();
        const spawnArea = 12;

        let centerVec = {
            x: Math.floor(this.mapData.length / 2),
            y: Math.floor(this.mapData[0].length / 2),
        }
        let pX;
        let pY;

        //gets a position outside of spawn area
        do{
            pX = Math.floor((Math.random() * this.mapData.length- 2) + 1);
            pY = Math.floor((Math.random() * this.mapData[0].length -2) + 1);
        }while(((pX > centerVec.x-spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y-spawnArea && pY < centerVec.y + spawnArea)))

        if(rand < (ResourceTerrain.GetResourceAmount(ResourceTypes.wood)/ResourceTerrain.GetResourceAmount(ResourceTypes.stone))/3)
            this.GenerateStone(pX, pY);
        else this.GenerateTree(pX, pY);
    }
    GenerateRandomStructures(count: number, RandomGenerator: Function): void{

        for(let i = 0; i < count; i++){
            let rand = RandomGenerator();
            const spawnArea = 12;

            let centerVec = {
                x: Math.floor(this.mapData.length / 2),
                y: Math.floor(this.mapData[0].length / 2),
            }
            let pX;
            let pY;

            //gets a position outside of spawn area
            do{
                pX = Math.floor((RandomGenerator() * this.mapData.length- 2) + 1);
                pY = Math.floor((RandomGenerator() * this.mapData[0].length -2) + 1);
            }while(((pX > centerVec.x-spawnArea && pX < centerVec.x + spawnArea) && (pY > centerVec.y-spawnArea && pY < centerVec.y + spawnArea))
                && !this.CheckBuildSpace(pX, pY, 5, 5));

            this.GenerateHouse(pX, pY, RandomGenerator);
        }
    }
    /**
     * Generates a tree at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateTree(x: number,y: number): void{
        if(ResourceTerrain.GetResourceAmount(ResourceTypes.wood) + 5 > MaxTResource.GetResourceAmount(ResourceTypes.wood)) return;

        //check if there is a space for the tree in a 3x3 grid
        if(this.CheckGridSpace(x,y, 3) == false) return;

        this.InsertResourcePixel(this.GeneratetreePixel(x,y,true));        
        this.InsertResourcePixel(this.GeneratetreePixel(x+1,y,false));
        this.InsertResourcePixel(this.GeneratetreePixel(x-1,y,false));
        this.InsertResourcePixel(this.GeneratetreePixel(x,y+1,false));
        this.InsertResourcePixel(this.GeneratetreePixel(x,y-1,false));
    }
    private GeneratetreePixel(x: number,y: number, isLog: boolean): ResourceData{
        if(isLog){
            const OnBreak = () =>{ ResourceManager.ins.AddResource(ResourceTypes.wood, Math.floor(1 + Math.random()*4)); }; // 1 - 4
            return new ResourceData(new rgb(200, 70, 50), PixelStatus.breakable, 
                6, x, y, HighlightPixel.border, ResourceTypes.wood, this.mapData[x][y], OnBreak);
        }else{
            const OnBreak = () =>{ ResourceManager.ins.AddResource(ResourceTypes.wood, Math.floor(Math.random()*1.7)); }; // 0 - 1
            return new ResourceData(new rgb(49, 87, 44),PixelStatus.breakable, 
                2, x, y, HighlightPixel.border, ResourceTypes.wood, this.mapData[x][y], OnBreak);        }
    }
    /**
     * Generates a stone at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateStone(x: number,y: number): void{
        if(ResourceTerrain.GetResourceAmount(ResourceTypes.stone) + 5 > MaxTResource.GetResourceAmount(ResourceTypes.stone)) return;

        //check if stone can freely spawn in a 3x3 grid
        if(this.CheckGridSpace(x,y, 3) == false) return;
        
        this.InsertResourcePixel(this.GenerateStonePixel(x,y));
        this.InsertResourcePixel(this.GenerateStonePixel(x+1,y));
        this.InsertResourcePixel(this.GenerateStonePixel(x-1,y));
        this.InsertResourcePixel(this.GenerateStonePixel(x,y+1));
        this.InsertResourcePixel(this.GenerateStonePixel(x,y-1));

        let stoneVec = {x: 1, y: 1}
        let repeats = Math.floor(Math.random()*3)+1;
        for(let i = 0; i < repeats; i++) {
            stoneVec.x = Math.floor(Math.random()*2)-1;
            stoneVec.y = Math.floor(Math.random()*2)-1;
            if(stoneVec.x == 0) stoneVec.x = 1;
            if(stoneVec.y == 0) stoneVec.y = 1;

            //prevents spawning two resources in the same space
            if(this.mapData[x+stoneVec.x][y+stoneVec.y] instanceof ResourceData) continue;

            this.InsertResourcePixel(this.GenerateStonePixel(x+stoneVec.x,y+stoneVec.y));
        }
    }
    private GenerateStonePixel(x: number,y: number): ResourceData{
        const ironChance = Math.floor(1 + Math.random()*5); // 1 - 5
        if(ironChance == 1){
            //Generate iron
            const OnBreak = () =>{ ResourceManager.ins.AddResource(ResourceTypes.iron_ore, Math.floor(1 + Math.random()*3)); }; // 1 - 3
            return new ResourceData(new rgb(221, 161, 94), PixelStatus.breakable, 9, 
                x, y,HighlightPixel.border, ResourceTypes.stone, this.mapData[x][y], OnBreak); 
        }else{
            //Generate stone
            const OnBreak = () =>{ ResourceManager.ins.AddResource(ResourceTypes.stone, Math.floor(1 + Math.random()*5)); }; // 1 - 5
            return new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, 
                x, y,HighlightPixel.border, ResourceTypes.stone, this.mapData[x][y], OnBreak); 
        }
    }
    private CheckGridSpace(x: number, y: number, size: number): boolean{
        if(size % 2 == 0) size++;

        for(let i = x-Math.floor(size/2); i <= x+Math.floor(size/2); i++){
            if(i < 0 || i > this.mapData.length) return false;
            for(let j = y-Math.floor(size/2); j<=y+Math.floor(size/2); j++){
                if(j < 0 || j > this.mapData[0].length || this.mapData[i][j].status != PixelStatus.walkable) return false;
            }
        }

        return true;
    }
    CheckBuildSpace(x: number, y:number, sizeX: number, sizeY: number): boolean{
        for(let i = x; i < x+sizeX; i++){
            for(let j = y; j < y+sizeY; j++){
                if(i < 0 || i > this.mapData.length || j < 0 || j > this.mapData[0].length || this.mapData[i][j].status != PixelStatus.walkable) return false;
            }
        }
        return true;
    }
    GenerateHouse(x: number, y: number, RandomGenerator: Function): void{
        //array of IDs:
        //0 - ground
        //1 - wall
        //2 - floor
        //3 - door
        //4 - window
        //5 - light
        const house: Array<Array<number>> = [
            [1, 1, 1, 4, 0],
            [1, 2, 2, 2, 4],
            [1, 2, 5, 2, 4],
            [1, 2, 2, 2, 1],
            [1, 1, 1, 3, 1],
        ];

        for(let i = 0; i < house.length; i++){
            for(let j = 0; j < house[0].length; j++){
                if(RandomGenerator() < 0.3) continue;
                let pixel: PixelData = nullPixel;
                //TODO: optimze by preseaching building and saving them in a dictionary
                switch(house[i][j]){
                    case 1:
                        pixel = FindBuilding("Stone Wall").at(x+j, y+i);
                        break;
                    case 2:
                        pixel = FindBuilding("Wooden Floor").at(x+j, y+i);
                        break;
                    case 3:
                        pixel = FindBuilding("Wooden Door").at(x+j, y+i);
                        break;
                    case 4:
                        pixel = FindBuilding("Glass").at(x+j, y+i);
                        break;
                    case 5:
                        pixel = FindBuilding("Lantern").at(x+j, y+i);
                        break;
                }
                if(pixel == nullPixel) pixel = PerlinPixel(x+j, y+i);
                this.ModifyMapData(x+j, y+i, pixel);
            }
        }
    }
}