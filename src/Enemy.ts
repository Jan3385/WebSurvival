class EnemyData extends EntityData{
    constructor(color: rgb, borderColor: rgb, x: number, y: number, EntityHealth:number){
        super(color, PixelStatus.breakable, x, y, borderColor, EntityHealth);
        EnemyList.push(this);
    }
    Die(): void{
        console.log('Enemy has died');
        Terrain.ins.ModifyMapData(this.x,this.y, this.OverlapPixel);
        EnemyList = EnemyList.filter(e => e != this);
    }
    MoveToPlayer(){ 
        const path = Pathfinding.aStar(new PathfindingNode(this.x, this.y), new PathfindingNode(Player.x, Player.y));

        console.log(path);

        //TODO: select random spot to move to
        if(path == null) {
            return;
        }

        path.forEach(element => {
            Renderer.ins.DrawGizmoLine(new Vector2(element.x, element.y), new Vector2(element.x + 1, element.y + 1));
        });

        this.Move(new Vector2(path[1].x - this.x, path[1].y - this.y));
    }
    Move(dir: Vector2){
        if(this.x + dir.x < 0 || this.x + dir.x >= Terrain.ins.MapX() || this.y + dir.y < 0 || this.y + dir.y >= Terrain.ins.MapY()) return;

        const moveTile = Terrain.ins.mapData[this.x + dir.x][this.y + dir.y];
        
        if(moveTile instanceof PlayerData){
            Player.Damage(1);
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
    public x: number;
    public y: number;

    constructor(x: number, y: number, walkable: boolean = true) {
        this.walkable = walkable;
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
    constructor() {
        // Define start and end nodes
        const startNode = new PathfindingNode(0, 0);
        const endNode = new PathfindingNode(8, 12);
        // Perform A* pathfinding
        const path = Pathfinding.aStar(startNode, endNode);
        if (path) {
            console.log("Path found:", path);
            path.forEach(element => {
                Renderer.ins.DrawGizmoLine(new Vector2(element.x, element.y), new Vector2(element.x + 1, element.y + 1));
            });
        } else {
            console.log("No path found");
        }
    }

    private static getHeuristic(nodeA: PathfindingNode, nodeB: PathfindingNode): number {
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }

    public static aStar(startNode: PathfindingNode, endNode: PathfindingNode): { x: number, y: number }[] | null {
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
                if ((!neighbor.walkable && (neighbor.x != Player.x || neighbor.y != Player.y)) || this.IsInSet(neighbor, closedSet)) {
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
                const cell = new PathfindingNode(newX, newY, Terrain.ins.mapData[newX][newY].status == PixelStatus.walkable);
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