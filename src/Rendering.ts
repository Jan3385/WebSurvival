//Class for rendering the game
class Renderer{
    public static ins: Renderer;
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

        window.addEventListener('resize', this.UpdateWindowSize);

        this.UpdateWindowSize();
    }
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        ctx.beginPath(); //Clear ctx from prev. frame

        Terrain.ins.IterateMap((pixel, x, y) => {
            if(!(pixel instanceof GlassData)) ctx.fillStyle = pixel.color.getWithLight(pixel.Brightness);
            else ctx.fillStyle = pixel.OverlaidPixel.color.MixWith(pixel.color, 0.4).getWithLight(pixel.Brightness);
                
            ctx.fillRect(x*canvasScale, y*canvasScale, canvasScale, canvasScale);
        });
        
        this.DrawInteractIndicator();
        
        ctx.strokeStyle = Player.HighlightColor.getWithLight(Math.max(0.35,Terrain.ins.mapData[Player.x][Player.y].Brightness));
        ctx.lineWidth = 2;
        ctx.strokeRect(Player.x*canvasScale+1, Player.y*canvasScale+1, canvasScale-2, canvasScale-2);

        if(this.LineGizmos.length != 0){
            ctx.beginPath();
            this.LineGizmos.forEach(element => {
                ctx.moveTo(element[0].x, element[0].y);
                ctx.lineTo(element[1].x, element[1].y);
            });
            ctx.stroke();
            this.LineGizmos = [];
        }
        
        //override the canvas if player is dead
        if(Player.respawnTime > 0){
            this.DrawDeathScreen(1 - Player.respawnTime/5);
            return;
        }
    }
    LineGizmos: [from: Vector2, to:Vector2][] = [];
    DrawGizmoLine(from: Vector2, to:Vector2){
        this.LineGizmos.push([
            new Vector2(from.x * canvasScale, from.y * canvasScale), 
            new Vector2(to.x * canvasScale, to.y * canvasScale)]);
    }
    DrawInteractIndicator(){
        if(canvasScale < 6.5) return;

        ctx.beginPath();

        Terrain.ins.IterateMap((pixel, x, y) => {
            if(IsHighlightable(pixel)){
                switch((<IHighlightable>pixel).Highlight){
                    case HighlightPixel.none:
                        break;
                    case HighlightPixel.lightBorder:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x*canvasScale, y*canvasScale, canvasScale-1, canvasScale-1);
                        break;
                    case HighlightPixel.border:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x*canvasScale+1, y*canvasScale+1, canvasScale-2, canvasScale-2);
                        break;
                    case HighlightPixel.thickBorder:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 4;
                        ctx.strokeRect(x*canvasScale+2, y*canvasScale+2, canvasScale-4, canvasScale-4);
                        break;
                    case HighlightPixel.slash:
                        ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x*canvasScale+1, y*canvasScale+1, canvasScale-2, canvasScale-2);
                        
                        ctx.beginPath();
                        ctx.moveTo(x*canvasScale+1, y*canvasScale+1);
                        ctx.lineTo(x*canvasScale+canvasScale-1, y*canvasScale+canvasScale-1);
                        ctx.stroke();
                        break;
                }
            }
        });
    }
    private DrawDeathScreen(t: number){
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, Math.min(canvas.height * (t*3), canvas.height));

        Player.respawnTime -= Math.min((1000/tickSpeed)/1000, Player.respawnTime);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = `50px Arial`;
        const textString = `You have died!`;
        const textRespawnTimer = `${Player.respawnTime.toFixed(1)}s`
        let textWidth = ctx.measureText(textString).width;
        ctx.fillText(textString , (canvas.width/2) - (textWidth / 2), canvas.height/2 - 35);
        textWidth = ctx.measureText(textRespawnTimer).width;
        ctx.fillText(textRespawnTimer , (canvas.width/2) - (textWidth / 2), canvas.height/2 + 35);
    }
    UpdateWindowSize(){
        canvasScale = Math.floor(window.innerWidth / 140);
        if(Terrain.ins.MapY() * canvasScale > window.innerHeight*0.8) canvasScale = Math.floor(window.innerHeight*0.7 / Terrain.ins.MapY());

        canvas.width = Terrain.ins.MapX() * canvasScale;
        canvas.height = Terrain.ins.MapY() * canvasScale;
    }
}