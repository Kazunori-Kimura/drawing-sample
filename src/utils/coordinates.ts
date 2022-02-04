import { Point } from '../types/common';

export const equalPoints = (a: Point, b: Point): boolean => {
    return a.x === b.x && a.y === b.y;
};
