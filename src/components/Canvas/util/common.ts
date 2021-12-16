export const clone = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data)) as T;
};

export const round = (value: number, figure = 3): number => {
    const n = 10 ** figure;
    const result = Math.round(value * n) / n;
    return result;
};
