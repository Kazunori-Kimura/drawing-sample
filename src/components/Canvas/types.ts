import { StructureCanvasProps } from '../../types/note';

export type BeamPoints = [number, number, number, number];

export interface Shape {
    type: 'beams' | 'forces' | 'trapezoids';
    id: string;
}

export type Point = [number, number];

export interface CanvasCoreHandler {
    toDataURL: () => string | undefined;
    getStructure: () => StructureCanvasProps;
}

/**
 * path:created イベント
 */
export interface PathEvent {
    path: fabric.Path;
}

export const isPathEvent = (item: unknown): item is PathEvent => {
    if (item && typeof item === 'object') {
        const temp = item as Record<string, unknown>;
        return typeof temp.path === 'object';
    }
    return false;
};

type PathStart = ['M' | 'm', number, number];
type PathMid = ['Q' | 'q', number, number, number, number];
type PathEnd = ['L' | 'l', number, number];

export type SVGPath = [PathStart, ...PathMid[], PathEnd];
export const isPathStart = (item: unknown): item is PathStart => {
    if (Array.isArray(item) && item.length === 3) {
        return (
            (item[0] === 'M' || item[0] === 'm') &&
            typeof item[1] === 'number' &&
            typeof item[2] === 'number'
        );
    }
    return false;
};
export const isPathEnd = (item: unknown): item is PathEnd => {
    if (Array.isArray(item) && item.length === 3) {
        return (
            (item[0] === 'L' || item[0] === 'l') &&
            typeof item[1] === 'number' &&
            typeof item[2] === 'number'
        );
    }
    return false;
};
export const isSVGPath = (item: unknown): item is SVGPath => {
    if (Array.isArray(item)) {
        if (item.length > 0) {
            const s = item[0];
            const e = item[item.length - 1];
            return isPathStart(s) && isPathEnd(e);
        }
        return true;
    }
    return false;
};
