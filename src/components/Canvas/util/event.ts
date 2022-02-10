import { Point } from '../../../types/common';

/**
 * ポインタの位置を返す
 * @param event
 * @returns
 */
export const getPointerPosition = (event: fabric.IEvent<Event>): Point | undefined => {
    if (event.e.type?.indexOf('touch') === 0) {
        const { touches } = event.e as TouchEvent;
        const { clientX, clientY } = touches[0];
        return { x: clientX, y: clientY };
    } else if (event.e.type?.indexOf('mouse') === 0) {
        const { clientX, clientY } = event.e as MouseEvent;
        return { x: clientX, y: clientY };
    }
    // touch でも mouse でもない Event の場合は undefined
};

export type Coords = [number, number];
export const isCoords = (item: unknown): item is Coords => {
    if (Array.isArray(item)) {
        return item.length === 2 && item.every((e) => typeof e === 'number');
    }
    return false;
};
const Tolerance = 3;

export const compareCoords = (a: Coords, b: Coords, isStrict = false): boolean => {
    // 許容範囲
    const tolerance = isStrict ? 0 : Tolerance;
    return Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance;
};
