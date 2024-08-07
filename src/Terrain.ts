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
    InsertResourcePixel(Pixel: ResourceData): void{
        Terrain.ModifyMapData(Pixel.x, Pixel.y, Pixel);

        ResourceTerrain.Add(Pixel.ResourceType, 1);
    }
    /**
     * Deletes the interactable pixel at the given X,Y position
     * @param {number} pX 
     * @param {number} pY 
     * @throws {ReferenceError} No interactable type at that location
     */
    DeleteResourcePixel(pX: number, pY: number, replacement: PixelData): void{
        ResourceTerrain.Remove((<ResourceData>mapData[pX][pY]).ResourceType, 1);

        this.ModifyMapData(pX, pY, replacement);
    }
    /**
     * Clears the map and fills it with perlin noise
     */
    Clear(): void{

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
        if(mPixel.status == PixelStatus.walkable){

            //if is player exiting a door, lock it
            if(mPixel instanceof DoorData) mPixel.Close();

            this.ModifyMapData(Player.x, Player.y, Player.OverlapPixel);
            Player.x += x;
            Player.y += y;
            Player.OverlapPixel = mapData[Player.x][Player.y];
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
        Player.OverlapPixel = mapData[Player.x][Player.y];
        this.ModifyMapData(Player.x, Player.y, new PlayerData(Player.color, Player.HighlightColor, Player.x, Player.y, Player.Health));
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

        if(rand < (ResourceTerrain.GetResourceAmount(ResourceTypes.wood)/ResourceTerrain.GetResourceAmount(ResourceTypes.stone))/3)
            this.GenerateStone(pX, pY);
        else this.GenerateTree(pX, pY);
    }
    /**
     * Generates a tree at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateTree(x: number,y: number): void{
        if(ResourceTerrain.GetResourceAmount(ResourceTypes.wood) + 5 > MaxTResource.GetResourceAmount(ResourceTypes.wood)) return;

        //check if there is a space for the tree in a 3x3 grid
        for(let i = x-1; i <= x+1; i++){
            if(i < 0 || i > mapData.length) return;
            for(let j = y-1; j<=y+1; j++){
                if(j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.walkable) return;
            }
        }

        let OnBreak = () =>{ Resources.AddResource(ResourceTypes.wood, Math.floor(1 + Math.random()*4)); }; // 1 - 4
        const tPixel: ResourceData = new ResourceData(new rgb(200, 70, 50), PixelStatus.breakable, 
            6, x, y, HighlightPixel.border, ResourceTypes.wood, mapData[x][y], OnBreak);
        Terrain.InsertResourcePixel(tPixel);
        
        OnBreak = () =>{ Resources.AddResource(ResourceTypes.wood, Math.floor(Math.random()*1.7)); }; // 0 - 1
        let lPixel = new ResourceData(new rgb(49, 87, 44),PixelStatus.breakable, 2, x+1, y, HighlightPixel.border, ResourceTypes.wood, mapData[x+1][y], OnBreak);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new ResourceData(new rgb(49, 87, 44),PixelStatus.breakable, 2, x-1, y, HighlightPixel.border, ResourceTypes.wood, mapData[x-1][y], OnBreak);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new ResourceData(new rgb(49, 87, 44),PixelStatus.breakable, 2, x, y+1, HighlightPixel.border, ResourceTypes.wood, mapData[x][y+1], OnBreak);
        Terrain.InsertResourcePixel(lPixel);
        lPixel = new ResourceData(new rgb(49, 87, 44),PixelStatus.breakable, 2, x, y-1, HighlightPixel.border, ResourceTypes.wood, mapData[x][y-1], OnBreak);
        Terrain.InsertResourcePixel(lPixel);
    }
    /**
     * Generates a stone at the given position (mainly for internal use)
     * @param {number} x 
     * @param {number} y 
     */
    GenerateStone(x: number,y: number): void{
        if(ResourceTerrain.GetResourceAmount(ResourceTypes.stone) + 5 > MaxTResource.GetResourceAmount(ResourceTypes.stone)) return;

        //check if stone can freely spawn in a 3x3 grid
        for(let i = x-1; i <= x+1; i++){
            if(i < 0 || i > mapData.length) return;
            for(let j = y-1; j<=y+1; j++){
                if(j < 0 || j > mapData[0].length || mapData[i][j].status != PixelStatus.walkable) return;
            }
        }

        const OnBreak = () =>{ Resources.AddResource(ResourceTypes.stone, Math.floor(1 + Math.random()*3)); }; // 1 - 3
        let sPixel: ResourceData;
        
        sPixel = new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, x, y,HighlightPixel.border, 
            ResourceTypes.stone,mapData[x][y], OnBreak);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, x+1, y,HighlightPixel.border, 
            ResourceTypes.stone,mapData[x+1][y], OnBreak);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, x-1, y,HighlightPixel.border, 
            ResourceTypes.stone,mapData[x-1][y], OnBreak);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, x, y+1,HighlightPixel.border, 
            ResourceTypes.stone,mapData[x][y+1], OnBreak);
        Terrain.InsertResourcePixel(sPixel);
        sPixel = new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, x, y-1,HighlightPixel.border, 
            ResourceTypes.stone,mapData[x][y-1], OnBreak);
        Terrain.InsertResourcePixel(sPixel);

        let stoneVec = {x: 1, y: 1}
        let repeats = Math.floor(Math.random()*3)+1;
        for(let i = 0; i < repeats; i++) {
            stoneVec.x = Math.floor(Math.random()*2)-1;
            stoneVec.y = Math.floor(Math.random()*2)-1;
            if(stoneVec.x == 0) stoneVec.x = 1;
            if(stoneVec.y == 0) stoneVec.y = 1;

            sPixel = new ResourceData(new rgb(200, 200, 200), PixelStatus.breakable, 6, 
                x+stoneVec.x, y+stoneVec.y,HighlightPixel.border, ResourceTypes.stone, mapData[x+stoneVec.x][y+stoneVec.y], OnBreak);
            Terrain.InsertResourcePixel(sPixel);
        }
    }
}