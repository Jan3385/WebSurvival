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

        // 16 : 10 resolution | 80x50 pixel map
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
    /**
     * Executes a draw call on the canvas, rendering everyting
     */
    Draw() {
        ctx.beginPath(); //Clear ctx from prev. frame
        for (let i = 0; i < canvas.width/canvasScale; i++) {
            for (let j = 0; j < canvas.height/canvasScale; j++) {
                const pixel = mapData[i][j];

                if(!(pixel instanceof GlassData)) ctx.fillStyle = pixel.color.getWithLight(pixel.Brightness);
                else ctx.fillStyle = pixel.OverlaidPixel.color.MixWith(pixel.color, 0.4).getWithLight(pixel.Brightness);
                
                ctx.fillRect(i*canvasScale, j*canvasScale, canvasScale, canvasScale);
            }
        }
        this.DrawInteractIndicator();
        
        ctx.strokeStyle = Player.HighlightColor.getWithLight(Math.max(0.35,mapData[Player.x][Player.y].Brightness));
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
        for(let i = 0; i < mapData.length; i++){
            for(let j = 0; j < mapData[0].length; j++){
                const pixel = mapData[i][j];
                if(IsHighlightable(pixel)){
                    switch((<IHighlightable>pixel).Highlight){
                        case HighlightPixel.none:
                            break;
                        case HighlightPixel.lightBorder:
                            ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 1;
                            ctx.strokeRect(i*canvasScale, j*canvasScale, canvasScale-1, canvasScale-1);
                            break;
                        case HighlightPixel.border:
                            ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 2;
                            ctx.strokeRect(i*canvasScale+1, j*canvasScale+1, canvasScale-2, canvasScale-2);
                            break;
                        case HighlightPixel.thickBorder:
                            ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
                            ctx.lineWidth = 4;
                            ctx.strokeRect(i*canvasScale+2, j*canvasScale+2, canvasScale-4, canvasScale-4);
                            break;
                        case HighlightPixel.slash:
                            ctx.strokeStyle = pixel.HighlightColor.getWithLight(pixel.Brightness);
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
    UpdateWindowSize(){
        canvasScale = Math.floor(window.innerWidth / 140);
        if(mapData[0].length * canvasScale > window.innerHeight*0.8) canvasScale = Math.floor(window.innerHeight*0.7 / mapData[0].length);

        canvas.width = mapData.length * canvasScale;
        canvas.height = mapData[0].length * canvasScale;
    }
}