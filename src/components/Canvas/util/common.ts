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

export const snap = ([x, y]: [number, number], snapSize = 25): [number, number] => {
    return [snapping(x, snapSize), snapping(y, snapSize)];
};
