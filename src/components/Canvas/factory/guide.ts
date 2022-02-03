import { fabric } from 'fabric';
import { Node } from '../../../types/shape';
import { BeamPoints } from '../types';
import { Vector, verticalNormalizeVector, vX, vY } from '../util';
import { NodeShape } from './node';

type CreateGuideLineFunction = {
    (points: BeamPoints, offset?: number): fabric.Group;
    (v1: Vector, v2: Vector, offset?: number): fabric.Group;
};

const GuideLineEdgeSize = 8;
const GuideLineColor = 'silver';
const GuideLineHeight = 14;

const defaultLineOptions: fabric.ILineOptions = {
    stroke: GuideLineColor,
    strokeWidth: 1,
};
const defaultEdgeOptions: fabric.ITriangleOptions = {
    width: GuideLineEdgeSize,
    height: GuideLineEdgeSize,
    stroke: GuideLineColor,
    strokeWidth: 1,
    fill: GuideLineColor,
    originX: 'center',
    originY: 'center',
    centeredRotation: true,
};
const defaultLabelOptions: fabric.ITextboxOptions = {
    fill: GuideLineColor,
    height: 10,
    fontSize: 10,
    fontFamily: 'sans-serif',
    textAlign: 'center',
    evented: false,
    selectable: false,
};

export const createGuideLineByVectors = (p1: Vector, p2: Vector, offset: number): fabric.Group => {
    let v1 = p1.clone();
    let v2 = p2.clone();
    if (v1.x > v2.x || (v1.x === v2.x && v1.y > v2.y)) {
        [v1, v2] = [v2, v1];
    }

    // 指定された線に直交する方向
    const verticalDir = verticalNormalizeVector(v1, v2);

    if (offset !== 0) {
        const vd = verticalDir.clone();
        // ベクトルの内積
        const cos = vY.dot(vd);
        if (cos >= 0) {
            // 直交する方向が vY の方向であれば反転させる
            vd.invert();
        }
        // offset の距離だけ離す
        vd.multiplyScalar(offset);
        v1.add(vd);
        v2.add(vd);
    }

    // 距離
    const distance = v1.distance(v2);
    // 方向
    const dir = v2.clone().subtract(v1).normalize();
    const angle = dir.angleDeg();

    // |<-->| こんな感じに描く
    const verticalLineLeft = new fabric.Line(
        [0, (-1 * GuideLineHeight) / 2, 0, GuideLineHeight / 2],
        defaultLineOptions
    );
    const verticalLineRight = new fabric.Line(
        [distance, (-1 * GuideLineHeight) / 2, distance, GuideLineHeight / 2],
        defaultLineOptions
    );
    const horizontalLine = new fabric.Line([0, 0, distance, 0], defaultLineOptions);
    const edgeLeft = new fabric.Triangle({
        top: 0,
        left: GuideLineEdgeSize / 2,
        angle: -90,
        ...defaultEdgeOptions,
    });
    const edgeRight = new fabric.Triangle({
        top: 0,
        left: distance - GuideLineEdgeSize / 2,
        angle: 90,
        ...defaultEdgeOptions,
    });

    const guide = new fabric.Group(
        [verticalLineLeft, edgeLeft, horizontalLine, edgeRight, verticalLineRight],
        {
            top: v1.y,
            left: v1.x,
            originX: 'left',
            originY: 'center',
            angle,
        }
    );

    let labelAngle = angle;
    let vdir = verticalDir.invert();
    let labelPosition = v1.clone().add(vdir.multiplyScalar(5));
    if (vdir.dot(vY) === 0) {
        // Y軸方向と直交する場合、下端を基準にラベルを描く
        vdir = vX.clone();
        labelAngle = -90;
        labelPosition = v2.clone().add(vdir.multiplyScalar(5));
    }

    const label = new fabric.Textbox(`${Math.round(distance)} m`, {
        top: labelPosition.y,
        left: labelPosition.x,
        width: distance,
        angle: labelAngle,
        ...defaultLabelOptions,
    });

    return new fabric.Group([guide, label], {
        selectable: false,
        evented: false,
        data: { type: 'guide' },
    });
};

export const createGuideLineByPoints = (points: BeamPoints, offset: number): fabric.Group => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    return createGuideLineByVectors(p1, p2, offset);
};

export const createGuideLine: CreateGuideLineFunction = (
    arg1: BeamPoints | Vector,
    arg2?: Vector | number,
    arg3?: number
): fabric.Group => {
    let offset = 0;
    if (Array.isArray(arg1)) {
        if (typeof arg2 === 'number') {
            offset = arg2;
        }
        return createGuideLineByPoints(arg1, offset);
    } else if (arg2 && typeof arg2 !== 'number') {
        if (typeof arg3 === 'number') {
            offset = arg3;
        }
        return createGuideLineByVectors(arg1, arg2, offset);
    }
    throw new Error('invalid parameters');
};

/**
 * 梁要素の寸法線
 * @param points
 * @returns
 */
export const createBeamGuideLine = (points: BeamPoints): fabric.Group => {
    return createGuideLine(points, 50);
};

/**
 * 分布荷重の寸法線
 */
export const createTrapezoidGuideLine = (
    points: BeamPoints,
    distanceI: number,
    distanceJ: number
): fabric.Group => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    const dir = p2.clone().subtract(p1).normalize();
    const distance = p1.distance(p2);

    const vi = p1.clone().add(dir.clone().multiplyScalar(distance * distanceI));
    const vj = p1.clone().add(dir.clone().multiplyScalar(distance * (1 - distanceJ)));

    return createGuideLine(vi, vj, 50);
};

type CreateGlobalGuideLineFunction = {
    (pointsX: Set<number>, pointsY: Set<number>, canvasHeight: number): fabric.Group[];
    (nodes: Node[], canvasHeight: number): fabric.Group[];
};

/**
 * 全体の寸法線の間隔
 */
const GlobalGuideLineInterval = 25;

/**
 * 全体の寸法線を作成する
 * @param pointsX
 * @param pointsY
 * @param canvasHeight
 * @returns
 */
const createGlobalGuideLineBySets = (
    pointsX: Set<number>,
    pointsY: Set<number>,
    canvasHeight: number
): fabric.Group[] => {
    const guides: fabric.Group[] = [];

    if (pointsX.size === 0 || pointsY.size === 0) {
        return [];
    }

    let minX = Number.MAX_SAFE_INTEGER;
    let maxY = 0;

    const arrX = [...pointsX].sort((a, b) => a - b);
    minX = arrX[0];
    const arrY = [...pointsY].sort((a, b) => a - b);
    maxY = arrY[arrY.length - 1];

    // horizontal
    // 全体
    const hy1 = Math.min(maxY + GlobalGuideLineInterval * 2, canvasHeight - 10);
    const hg1 = createGuideLine([minX, hy1, arrX[arrX.length - 1], hy1]);
    guides.push(hg1);

    // 内訳
    const hy2 = hy1 - GlobalGuideLineInterval;
    for (let i = 0; i < arrX.length - 1; i++) {
        const x1 = arrX[i];
        const x2 = arrX[i + 1];
        const hg = createGuideLine([x1, hy2, x2, hy2]);
        guides.push(hg);
    }

    // vertical
    // 全体
    const vx1 = Math.max(GlobalGuideLineInterval, minX - GlobalGuideLineInterval * 2);
    const vg1 = createGuideLine([vx1, arrY[0], vx1, maxY]);
    guides.push(vg1);

    // 内訳
    const vx2 = vx1 + GlobalGuideLineInterval;
    for (let i = 0; i < arrY.length - 1; i++) {
        const y1 = arrY[i];
        const y2 = arrY[i + 1];
        const vg2 = createGuideLine([vx2, y1, vx2, y2]);
        guides.push(vg2);
    }

    return guides;
};

const createGlobalGuideLineByArray = (nodes: Node[], canvasHeight: number): fabric.Group[] => {
    const guidePointsX = new Set<number>();
    const guidePointsY = new Set<number>();

    nodes.forEach(({ x, y }) => {
        guidePointsX.add(x);
        guidePointsY.add(y);
    });

    return createGlobalGuideLineBySets(guidePointsX, guidePointsY, canvasHeight);
};

/**
 * 全体の寸法線を作成する
 * @param arg1
 * @param arg2
 * @param arg3
 * @returns
 */
export const createGlobalGuideLine: CreateGlobalGuideLineFunction = (
    arg1: Set<number> | Node[],
    arg2: Set<number> | number,
    arg3?: number
): fabric.Group[] => {
    if (Array.isArray(arg1) && typeof arg2 === 'number') {
        return createGlobalGuideLineByArray(arg1, arg2);
    } else if (arg1 instanceof Set && arg2 instanceof Set && typeof arg3 === 'number') {
        return createGlobalGuideLineBySets(arg1, arg2, arg3);
    }
    throw new Error('invalid parameters');
};

/**
 * 全体の寸法線を再作成する
 * @param canvas
 * @param nodeMap
 * @param guides
 */
export const recreateGlobalGuideLines = (
    canvas: fabric.Canvas,
    nodeMap: Record<string, NodeShape>,
    guides: fabric.Group[]
): void => {
    const nodes = Object.values(nodeMap).map((shape) => shape.data);
    const lines = createGlobalGuideLine(nodes, canvas.height ?? 0);
    if (guides.length > 0) {
        // 表示済みの寸法線を削除
        canvas.remove(...guides);
        // 配列をクリア
        guides.length = 0;
    }
    // 全体の寸法線を表示
    canvas.add(...lines);
    guides.push(...lines);
};
