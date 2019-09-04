import * as THREE from "three";
import { Fisheye } from "./Fisheye";
export declare type Orientation = 'ceiling' | 'floor' | 'wall';
/**
 * Equirectangular Cylindrical Mercator
* http://wiki.panotools.org/Projections
*/
export declare class Fisheye2Equirectangular extends Fisheye<THREE.OrthographicCamera> {
    protected mesh_num: number;
    private meshes;
    private texis;
    private cameraOrientation;
    constructor(o?: {
        orientation?: Orientation;
    });
    render(): void;
    protected load(): void;
    protected unload(): void;
    private updateCameraOrientation;
    setOrientation(orientation: Orientation): void;
    orientation: Orientation;
    shift: number;
    shiftDegrees: number;
    reload(): void;
    drag(type: "start" | "move", offsetX: number, offsetY: number): void;
}
export declare function createPanoramaMesh(fisheye_texture: any, panorama_width?: number, R1_ratio?: number, R2_ratio?: number): any;
