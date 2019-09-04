import * as THREE from "three";
import { Fisheye, Radian } from "./Fisheye";
export interface CameraConfig {
    region: FishEyeRegion;
    direction: DirectionOfView;
    zoom: number;
}
export declare type Pixel = number;
/**
 * Position and size of the fisheye circle on the image
 */
export interface FishEyeRegion {
    centerX: Pixel;
    centerY: Pixel;
    radius: Pixel;
}
/**
 * Gaze point direction, unit
 */
export interface DirectionOfView {
    pitch: Radian;
    yaw: Radian;
}
export declare type Orientation = 'ceiling' | 'floor' | 'wall';
/**
 * Convert fish eye cnv to perspective projection
 * A reusable gl renderer that can dynamically change the source cnv
 * @example
 * ```js
 * // life cycle
 * const a = new FisheyeCanvas2PerspectiveRenderer();
 * a.changeSource(video);         // Fisheye source specification
 * a.updateFisheyeRegion(region); // Specify the region to be clipped from the fisheye source
 * a.setCanvasSize(size);         // Specify output canvas size
 * a.setCameraPose(pose);         // Specify camera orientation
 * a.render();                    // drawing
 * document.body.append(a.canvas); // Result display

 * ```
 */
export declare class Fisheye2Perspective extends Fisheye<THREE.PerspectiveCamera> {
    /**
     * Texture clipping source fish eye
     */
    readonly texctx1: CanvasRenderingContext2D;
    readonly texctx2: CanvasRenderingContext2D;
    /**
     * Drawing mode
     * true - Texture & polygon reduction mode
     * false - naive mode
     */
    readonly sep_mode: boolean;
    readonly collisionSphere: THREE.Mesh;
    /** Before load === rewrite before src change */
    private cameraOrientation;
    mesh_num: number;
    private meshes;
    private texis;
    private readonly local;
    private CAMERA_PITCH_MAX;
    private CAMERA_PITCH_MIN;
    private CAMERA_YAW_MAX;
    private CAMERA_YAW_MIN;
    readonly debug: boolean;
    private prevEuler;
    constructor(o?: {
        textureSizeExponent?: number;
        mesh?: number;
        sep_mode?: boolean;
        orientation?: Orientation;
        debug?: boolean;
    });
    destructor(): void;
    /**
     * draw
     * needsUpdate to render
     */
    render(): void;
    orientation: Orientation;
    getViewLimits(): Object;
    getViewLimitsDegrees(): Object;
    pitchDegrees: number;
    pitch: Radian;
    private _yaw;
    yawDegrees: number;
    yaw: Radian;
    cameraPose: DirectionOfView;
    cameraPoseDegrees: DirectionOfView;
    zoom: number;
    setSphereScale(x: number, y: number, z: number): void;
    /**
     * Screen information
     */
    config: CameraConfig;
    protected updateFisheyeRegion(): void;
    /**
     * Erase previous resources
     */
    protected unload(): void;
    /**
     * Resource replacement
     */
    protected load(): void;
    drag(type: "start" | "move", offsetX: number, offsetY: number): void;
}
