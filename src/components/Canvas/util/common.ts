export const clone = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data)) as T;
};

export const round = (value: number, figure = 3): number => {
    const n = 10 ** figure;
    const result = Math.round(value * n) / n;
    return result;
};

const snapping = (value: number, snapSize = 25): number => {
    const n = value / snapSize;
    const i = Math.round(n) * snapSize;
    return i;
};

export const DEFAULT_SNAP_SIZE = 25;

export const snap = ([x, y]: [number, number], snapSize = DEFAULT_SNAP_SIZE): [number, number] => {
    return [snapping(x, snapSize), snapping(y, snapSize)];
};
