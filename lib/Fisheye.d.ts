import * as THREE from "three";
export declare abstract class Fisheye<Camera extends THREE.Camera> {
    /**
      * gl canvas
      */
    readonly canvas: HTMLCanvasElement;
    /**
     * three
     */
    readonly camera: Camera;
    protected readonly renderer: THREE.WebGLRenderer;
    protected readonly scene: THREE.Scene;
    private skybox;
    private skyboxtex;
    /**
     * Texture clipping source fish eye
     */
    readonly texctx: CanvasRenderingContext2D;
    /** Fish eye of conversion source */
    private source;
    /** The value of n of the size of the texture which becomes 2 n */
    private exponent;
    /**
     * The value of n of the size of the texture which becomes 2 n
     * When rewriting this.resize (); doing
     */
    defaultExponent: number | null;
    /** Area cut from square texture */
    protected region: {
        centerX: number;
        centerY: number;
        radius: number;
    };
    /**
     * ```js
     * ctx.drawImage(video,
     *   sx, sy, sw, sh,
     *   dx, dy, dw, dh
     * );```
     */
    protected pos: [number, number, number, number, number, number, number, number];
    debug: boolean;
    constructor(camera: Camera, o?: {
        textureSizeExponent?: number;
        mesh?: number;
        debug?: boolean;
    });
    /**
     * @param source - Change fish eye of conversion source Change something
     */
    src: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | null;
    centerX: number;
    centerY: number;
    radius: number;
    /**
     * Adjust the position of the fish eye circle
     */
    fisheyeRegion: {
        centerX: number;
        centerY: number;
        radius: number;
    };
    width: number;
    height: number;
    /**
     * Optimize the current renderer to the current pixel size
     */
    canvasSize: {
        width: number;
        height: number;
    };
    destructor(): void;
    abstract render(): void;
    abstract drag(type: "start" | "move", offsetX: number, offsetY: number): any;
    protected abstract load(): void;
    protected abstract unload(): void;
    /**
     * Fit texture to size of cam.src
     */
    resize(): void;
    /**
     * Calculation of fisheye clipping region
     */
    protected updateFisheyeRegion(): void;
}
export declare function load_skybox_texture(path?: string): Promise<THREE.CubeTexture>;
export declare function createSkyboxMesh(skybox_texture: THREE.CubeTexture): THREE.Mesh;
/**
 * Assume a sphere with radius 1
 * @param longitude - Longitude rad
 * @param latitude - Latitude rad
 * @return [x, y]
 */
export declare function sphere2Mercator(longitude: Radian, latitude: Radian): [number, number];
/**
 * Assume a sphere with radius 1
 * @param x
 * @param y
 * @return [longitude, latitude]
 */
export declare function mercator2Sphere(x: number, y: number): [Radian, Radian];
/**
 * From a square fisheye image of vertical and horizontal 2
 * Projection (up) to upper hemispherical polar coordinates with radius 1
 * @param x ∈ [-1, 1]
 * @param y ∈ [-1, 1]
 * @return [longitude, latitude] - Spherical coordinates
 */
export declare function fisheye2Sphere(x: number, y: number, r?: number): [Radian, Radian] | null;
/**
 * From the upper hemispherical polar coordinate with radius 1
 * Projection (down) to square coordinates centered on the origin of vertical and horizontal 2
 * @param longitude - Spherical coordinates
 * @param latitude - Spherical coordinates
 * @return [x, y] ∈ [-1, 1]
 */
export declare function sphere2Fisheye(longitude: Radian, latitude: Radian, r?: number): [number, number];
/**
 * @param alpha - Right-handed coordinate system z axis Left turning around here Euler angles
 * @param beta - Right hand coordinate system x axis Around left and left Euler angles
 * @param gamma - Right hand coordinate system y axis Around left and left Euler angles
 */
export declare function rotate(alpha: Radian, beta: Radian, gamma: Radian): void;
export declare type Radian = number;
/**
 * Used to convert cylindrical texture to fisheye image.
 */
export declare function fisheye2equirectangular(x: number, y: number): [number, number];
