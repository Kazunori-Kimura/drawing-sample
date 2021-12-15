import Vector from 'victor';

export const lerp = (v1: Vector, v2: Vector, alpha: number): Vector => {
    const dir = v2.clone().subtract(v1).normalize();
    const distance = v1.distance(v2);
    const mv = dir.multiplyScalar(distance * alpha);
    return v1.clone().add(mv);
};

export const verticalNormalizeVector = (v1: Vector, v2: Vector): Vector => {
    const dir = v2.clone().subtract(v1).normalize();
    const v = new Vector(dir.y, dir.x * -1).normalize();
    return v;
};
