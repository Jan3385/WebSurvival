class EnemyData extends EntityData{
    path: {x: number, y: number}[] | null = [];
    IsRaidEnemy: boolean = GameTime.ins.SpawnRaidEnemies();
    constructor(color: rgb, borderColor: rgb, x: number, y: number, EntityHealth:number){
        super(color, PixelStatus.breakable, x, y, borderColor, EntityHealth);
        EnemyList.push(this);
        this.Move(new Vector2(0, 0));
    }
    Die(): void{
        Terrain.ins.ModifyMapData(this.x,this.y, this.OverlapPixel);
        EnemyList = EnemyList.filter(e => e != this);

        //drop resources
        const dropAmount = Math.floor(Math.random() * 2) + 1;
        ResourceManager.ins.AddResource(ResourceTypes.human_meat, dropAmount);
    }
    Despawn(): void{
        Terrain.ins.ModifyMapData(this.x,this.y, this.OverlapPixel);
        EnemyList = EnemyList.filter(e => e != this);
    }
    MoveToPlayer(){ 
        if(Player.OverlapPixel.Indoors && !this.IsRaidEnemy){
            //move a random direction half the time
            if(Math.random() < 0.5) return;
            const dir = AroundDir[Math.floor(Math.random() * AroundDir.length)];
            this.Move(dir);
            return;
        }

        //Generate path if needed or when the player is too far from the end point
        if(this.path == null || (this.path != null && this.path.length <= 1)
            || Math.abs(this.path[this.path.length-1].x - Player.x) + Math.abs(this.path[this.path.length-1].y - Player.y) > this.path.length-4){

            this.path = Pathfinding.aStar(new PathfindingNode(this.x, this.y), new PathfindingNode(Player.x, Player.y), this.IsRaidEnemy);
        }

        if(this.path == null) {
            //move a random direction half the time
            if(Math.random() < 0.5) return;
            const dir = AroundDir[Math.floor(Math.random() * AroundDir.length)];
            this.Move(dir);
            return;
        }

        /* DEBUG: Shows path on map
        this.path.forEach(element => {
            Renderer.ins.DrawGizmoLine(new Vector2(element.x, element.y), new Vector2(element.x + 1, element.y + 1));
        });*/

        this.Move(new Vector2(this.path[1].x - this.x, this.path[1].y - this.y));

        try{
            if(Terrain.ins.mapData[this.path[0].x][this.path[0].y].status == PixelStatus.walkable) 
                this.path.shift();
        }catch(e){
            this.path = null;	
        }
    }
    Move(dir: Vector2){
        if(this.x + dir.x < 0 || this.x + dir.x >= Terrain.ins.MapX() || this.y + dir.y < 0 || this.y + dir.y >= Terrain.ins.MapY()) return;

        const moveTile = Terrain.ins.mapData[this.x + dir.x][this.y + dir.y];
        
        if(moveTile instanceof PlayerData){
            Player.Damage(1);
            return;
        }

        //if attempting to walk into an unwalkable tile force a path recalculation
        if(moveTile.status != PixelStatus.walkable){
            if(moveTile instanceof BuildingData && this.IsRaidEnemy){
                moveTile.Damage(1);
            }else{
                this.path = null;
            }
            return;
        }

        Terrain.ins.ModifyMapData(this.x,this.y, this.OverlapPixel);
        this.x += dir.x;
        this.y += dir.y;
        this.OverlapPixel = moveTile;
        Terrain.ins.ModifyMapData(this.x,this.y, this);
    }
}
class PathfindingNode {
    public gCost: number;
    public hCost: number;
    public fCost: number;
    public parent: PathfindingNode | null;  // Track the parent node to trace the path

    public walkable: boolean;
    public isBuilding: boolean;
    public x: number;
    public y: number;

    constructor(x: number, y: number, walkable: boolean = true, isBuilding: boolean = false) {
        this.walkable = walkable;
        this.isBuilding = isBuilding;
        this.x = x;
        this.y = y;

        this.gCost = 0;
        this.hCost = 0;
        this.fCost = 0;
        this.parent = null;
    }

    calculateFCost(): void {
        this.fCost = this.gCost + this.hCost;
    }
}

class Pathfinding {
    constructor() { }

    private static getHeuristic(nodeA: PathfindingNode, nodeB: PathfindingNode): number {
        //skip if the building is too strong
        let ObstaclePenalty = 0;
        const PixelDataAtB = Terrain.ins.mapData[nodeB.x][nodeB.y];
        if(PixelDataAtB instanceof BuildingData) ObstaclePenalty = PixelDataAtB.Health;

        return (Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y)) + ObstaclePenalty;
    }

    public static aStar(startNode: PathfindingNode, endNode: PathfindingNode, PathThruBuildings: boolean): { x: number, y: number }[] | null {
        let openSet: PathfindingNode[] = [];
        let closedSet: Set<PathfindingNode> = new Set();

        openSet.push(startNode);

        while (openSet.length > 0) {
            // Get the node with the lowest fCost
            let currentNode = openSet.reduce((prev, curr) => (prev.fCost < curr.fCost ? prev : curr));

            if (this.IsSameNode(currentNode, endNode)) {
                // Reconstruct and return the best path using the parent nodes
                return this.retracePath(currentNode);
            }

            openSet = openSet.filter(node => !this.IsSameNode(node, currentNode));
            closedSet.add(currentNode);

            for (let neighbor of this.getNeighbors(currentNode)) {
                //check for any path even with buildings
                if(PathThruBuildings && 
                    (neighbor.walkable || neighbor.isBuilding)){

                    if(this.IsInSet(neighbor, closedSet)) continue;
                } //check for free path without buildings
                else if ((!neighbor.walkable && (neighbor.x != Player.x || neighbor.y != Player.y)) || this.IsInSet(neighbor, closedSet)) {
                    continue;
                }

                let newMovementCostToNeighbor = currentNode.gCost + Pathfinding.getHeuristic(currentNode, neighbor);
                if (newMovementCostToNeighbor < neighbor.gCost || !this.IsInSet(neighbor, openSet)) {
                    neighbor.gCost = newMovementCostToNeighbor;
                    neighbor.hCost = Pathfinding.getHeuristic(neighbor, endNode);
                    neighbor.calculateFCost();
                    neighbor.parent = currentNode;  // Set the parent to trace the path

                    if (!this.IsInSet(neighbor, openSet)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // If no path is found, return null
        return null;
    }

    // Function to retrace the path from the end node to the start node
    private static retracePath(endNode: PathfindingNode): { x: number, y: number }[] {
        let path: { x: number, y: number }[] = [];
        let currentNode: PathfindingNode | null = endNode;

        while (currentNode !== null) {
            path.push({ x: currentNode.x, y: currentNode.y });
            currentNode = currentNode.parent;  // Move to the parent node
        }

        return path.reverse();  // Reverse the path to start from the startNode
    }

    // Function to get the neighbors of a node
    private static getNeighbors(node: PathfindingNode): PathfindingNode[] {
        const neighbors: PathfindingNode[] = [];

        for (let dir of AroundDir) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            if (newX >= 0 && newX < Terrain.ins.MapX() && newY >= 0 && newY < Terrain.ins.MapY()) {
                const cell = new PathfindingNode(newX, newY, Terrain.ins.mapData[newX][newY].status == PixelStatus.walkable, Terrain.ins.mapData[newX][newY] instanceof BuildingData);
                neighbors.push(cell);
            }
        }

        return neighbors;
    }

    private static IsSameNode(nodeA: PathfindingNode, nodeB: PathfindingNode): boolean {
        return nodeA.x === nodeB.x && nodeA.y === nodeB.y;
    }

    private static IsInSet(node: PathfindingNode, set: Set<PathfindingNode> | PathfindingNode[]): boolean {
        for (let setNode of set) {
            if (this.IsSameNode(node, setNode)) {
                return true;
            }
        }
        return false;
    }
}