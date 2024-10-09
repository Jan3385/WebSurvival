//returns a function that generates a random number between 0 and 1 exclusive using a seed
function RandomUsingSeed(seed: number) {
    const m: number = 0x80000000; // 2**31
    const a: number = 1103515245;
    const c: number = 12345;

    let state: number = seed;

    //returns a random number between 0 and 1 (not including 1)
    return function() {
        state = (a * state + c) % m;
        return state / (m - 1);
    };
}

class PerlinNoise {
    rnd: () => number;
    permutation: number[];
    gradients: { x: number, y: number }[];
    constructor(seed: number) {
        this.rnd = RandomUsingSeed(seed);
        this.permutation = this.generatePermutation();
        this.gradients = this.generateGradients();
    }

    generatePermutation(): number[] {
        let permutation: number[] = [];
        for (let i = 0; i < 256; i++) {
            permutation.push(i);
        }
        permutation.sort(() => this.rnd() - 0.5);
        return permutation.concat(permutation);
    }

    generateGradients(): { x: number, y: number }[]{
        const gradients = [];
        for (let i = 0; i < 256; i++) {
            const theta = this.rnd() * 2 * Math.PI;
            gradients.push({ x: Math.cos(theta), y: Math.sin(theta) });
        }
        return gradients;
    }

    dotGridGradient(ix: number, iy: number, x: number, y: number): number {
        const gradient = this.gradients[(this.permutation[ix + this.permutation[iy & 255]] & 255)];
        const dx: number = x - ix;
        const dy: number = y - iy;
        return dx * gradient.x + dy * gradient.y;
    }

    fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    //returns value between 0 and 1
    perlin(x: number, y: number): number {
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

    perlinColorTerrain(x: number, y: number) {
        const value = this.perlin(x, y);
        //ocean <1 - 0.7)
        let t: number = (value - 0.7) / 0.3; //from 0.7 - 1 to 0 - 1
        if(value > 0.7) return {
            r: this.lerp(11,4, t),
            g: this.lerp(89,60, t),
            b: this.lerp(214,201, t),
            s: PixelStatus.block,
            t: TerrainType.water
        }
        //sand <0.7 - 0.62)
        t = (value - 0.62) / 0.08; //from 0.62 - 0.7 to 0 - 1
        if(value > 0.62) return {
            r: this.lerp(232,204, t),
            g: this.lerp(217,191, t),
            b: this.lerp(12,8, t),
            s: PixelStatus.walkable,
            t: TerrainType.sand
        }

        //grass <0.62 - 0>
        t = (value - 0) / 0.62; //from 0 - 0.62 to 0 - 1
        return {
            r: this.lerp(22, 42,t),
            g: this.lerp(153, 176,t),
            b: this.lerp(5, 25,t),
            s: PixelStatus.walkable,
            t: TerrainType.ground            
        };
    }
    pixel(x: number,y: number){
        return this.perlinColorTerrain(x,y);
    }
}