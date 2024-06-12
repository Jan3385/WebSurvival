// -- Input Manager --
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

let buttons = document.getElementsByClassName("SelectionButtonDiv")[0].querySelectorAll("button");

let MovementVector = {x:0,y:0};

let usedInput = false;
function onKeyDown(event){
    switch(event.keyCode){
        case 87:
            MovementVector.y = -1;
            break;
        case 68:
            MovementVector.x = 1;
            break;
        case 83:
            MovementVector.y = 1;
            break;
        case 65:
            MovementVector.x = -1;
            break;
    }
    usedInput = false;
}
let clearX = false;
let clearY = false;
function onKeyUp(event){
    if(event.keyCode == 87 || event.keyCode == 83){
        if(usedInput) MovementVector.y = 0;
        else clearY = true;
    }
    if(event.keyCode == 68 || event.keyCode == 65){
       if(usedInput) MovementVector.x = 0;
       else clearX = true;
    }
}
function UpdateInput(){
    usedInput = true;
    if(clearX) {
        MovementVector.x = 0;
        clearX = false;
    }
    if(clearY) {
        MovementVector.y = 0;
        clearY = false;
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
        //ocean
        if(value > 0.7) return {
            r: value*10,
            g: value*10,
            b: value*400,
            s: PixelStatus.block
        }
        //sand
        if(value > 0.62) return {
            r: value*255 + 30,
            g: value * 255 + 30,
            b: value*10,
            s: PixelStatus.free
        }
        //hills or rock (probably delete later)
        //if(value < 0.25) return `rgb(${255 - value * 170}, ${255 - value * 170}, ${255 - value * 170})`;
        //grass
        return {
            r: value*50,
            g: 240 - value*90,
            b: value*50,
            s: PixelStatus.free
        };
    }
    pixel(x,y){
        return PixelData(this.perlinColorTerrain(x,y));
    }
}
let Perlin = new PerlinNoise(Math.random() * 1000); //TODO add custom seed