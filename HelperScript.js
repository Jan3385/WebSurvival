// -- Input Manager --
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

let InputKey = null;
let inputRegistered = false;
let keyUnpressed = false;
function onKeyDown(event){
    InputKey = event.keyCode;
    inputRegistered = false;
    keyUnpressed = false;
}
function onKeyUp(event){
    if(InputKey == event.keyCode){
        keyUnpressed = true;
        if(inputRegistered){
            InputKey = null;
        }
    }
}
function UpdateInput(){
    inputRegistered = true;
    if(keyUnpressed && InputKey != null){
        InputKey = null;
    }
}

// -- Perlin Noise Generator --
function RandomUsingSeed(seed) {
    var m = 0x80000000; // 2**31
    var a = 1103515245;
    var c = 12345;

    var state = seed;

    return function() {
        state = (a * state + c) % m;
        return state / (m - 1);
    };
}

class PerlinNoise {
    constructor(seed) {
        this.rnd = RandomUsingSeed(seed);
        this.permutation = this.generatePermutation();
        this.gradients = this.generateGradients();
    }

    generatePermutation() {
        let permutation = [];
        for (let i = 0; i < 256; i++) {
            permutation.push(i);
        }
        permutation.sort(() => this.rnd() - 0.5);
        return permutation.concat(permutation);
    }

    generateGradients() {
        const gradients = [];
        for (let i = 0; i < 256; i++) {
            const theta = this.rnd() * 2 * Math.PI;
            gradients.push({ x: Math.cos(theta), y: Math.sin(theta) });
        }
        return gradients;
    }

    dotGridGradient(ix, iy, x, y) {
        const gradient = this.gradients[(this.permutation[ix + this.permutation[iy & 255]] & 255)];
        const dx = x - ix;
        const dy = y - iy;
        return dx * gradient.x + dy * gradient.y;
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    //returns value between 0 and 1
    perlin(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const n00 = this.dotGridGradient(X, Y, x, y);
        const n01 = this.dotGridGradient(X, Y + 1, x, y);
        const n10 = this.dotGridGradient(X + 1, Y, x, y);
        const n11 = this.dotGridGradient(X + 1, Y + 1, x, y);

        const x1 = this.lerp(n00, n10, u);
        const x2 = this.lerp(n01, n11, u);

        return (this.lerp(x1, x2, v)+1)/2;
    }

    perlinColorTerrain(x, y) {

        const value = this.perlin(x, y);
        console.log(value);
        if(value > 0.7) return {
            c: `rgb(${value * 10}, ${value * 10}, ${value * 400})`,
            s: PixelStatus.block
        }
        if(value > 0.62) return {
            c: `rgb(${value * 255 + 30}, ${value * 255 + 30}, ${value * 10})`,
            s: PixelStatus.free
        }
        //if(value < 0.25) return `rgb(${255 - value * 170}, ${255 - value * 170}, ${255 - value * 170})`;
        return {
            c: `rgb(${value * 50}, ${230 - value * 60}, ${value * 50})`,
            s: PixelStatus.free
        };
    }
    pixel(x,y){
        return PixelData(this.perlinColorTerrain(x,y));
    }
}
let Perlin = new PerlinNoise(Math.random() * 1000); //TODO add custom seed