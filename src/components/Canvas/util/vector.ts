import Vector from 'victor';

export { Vector };

// X方向のベクトル
export const vX = new Vector(1, 0);
// Y方向のベクトル
export const vY = new Vector(0, 1);

/**
 * v1 と v2 の間にある vp を取得する
 * @param v1
 * @param v2
 * @param alpha
 * @returns
 */
export const lerp = (v1: Vector, v2: Vector, alpha: number): Vector => {
    if (alpha >= 1) {
        return v2;
    }
    if (alpha <= 0) {
        return v1;
    }
    const dir = v2.clone().subtract(v1).normalize();
    const distance = v1.distance(v2);
    const mv = dir.multiplyScalar(distance * alpha);
    return v1.clone().add(mv);
};

/**
 * v1 と v2 に直交する単位ベクトルを返す
 * @param v1
 * @param v2
 * @returns
 */
export const verticalNormalizeVector = (v1: Vector, v2: Vector): Vector => {
    const dir = v2.clone().subtract(v1).normalize();
    const v = new Vector(dir.y, dir.x * -1).normalize();

    const value = vY.dot(v);
    if (value > 0) {
        v.invert();
    }

    return v;
};
