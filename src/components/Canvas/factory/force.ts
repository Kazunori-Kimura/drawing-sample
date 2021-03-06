import { fabric } from 'fabric';
import { Force } from '../../../types/shape';
import { lerp, Vector, verticalNormalizeVector } from '../util';
import { BeamShape } from './beam';
import { createArrow, labelBaseProps, unresponseShapeProps } from './common';

export type ForceShape = {
    data: Force;
    force: fabric.Group;
    label: fabric.Textbox;
};

/**
 * 集中荷重の基本の長さ
 */
const ForceBaseLength = 30;
const ForceColor = 'orange';

const defaultForceLabelProps: fabric.ITextOptions = {
    ...unresponseShapeProps,
    ...labelBaseProps,
    fill: ForceColor,
    textAlign: 'left',
};

/**
 * 集中荷重の作成
 * @param force
 * @param points
 * @param ave
 */
export const createForce = (
    force: Force,
    points: [number, number, number, number],
    ave: number,
    readonly = false,
    unit = 'kN'
): ForceShape => {
    // 梁要素の i端、j端
    const pi = new Vector(points[0], points[1]);
    const pj = new Vector(points[2], points[3]);
    // 集中荷重の始点
    const head = lerp(pi, pj, force.distanceI);
    // 集中荷重の方向
    const dir = verticalNormalizeVector(pi, pj);
    // 大きさ
    const ratio = force.force / ave;
    const forceLength = isNaN(ratio) ? ForceBaseLength : ForceBaseLength * ratio;
    // 集中荷重の終点
    const tail = head.clone().add(dir.clone().multiplyScalar(forceLength));

    // 矢印
    const arrow = createArrow(head, tail, {
        fill: ForceColor,
        stroke: ForceColor,
        name: force.id,
        data: {
            type: 'force',
            ...force,
        },
        selectable: !readonly,
        evented: !readonly,
    });

    // ラベルの基準位置
    const beamDir = pj.clone().subtract(pi).normalize();
    const labelPosition = head.clone().add(beamDir.clone().multiplyScalar(5));
    const angle = dir.angleDeg();

    const label = new fabric.Textbox(` ${force.force} ${unit}`, {
        ...defaultForceLabelProps,
        top: labelPosition.y,
        left: labelPosition.x,
        width: Math.max(forceLength, 140),
        angle,
        // デフォルトで非表示
        visible: false,
    });

    return { data: force, force: arrow, label };
};

/**
 * 平均値を計算する
 * @param forces
 * @returns
 */
export const calcForceAverage = (forces: Force[]): number => {
    let forceAverage = 0;
    if (forces.length > 0) {
        const { force: total } = forces.reduce((prev, current) => {
            const item: Force = {
                ...prev,
                force: prev.force + current.force,
            };
            return item;
        });
        forceAverage = total / forces.length;
    }

    return forceAverage;
};

/**
 * 梁要素に紐づく集中荷重を再作成する
 * @param canvas
 * @param beamShape
 * @param forceMap
 */
export const recreateForces = (
    canvas: fabric.Canvas,
    beamShape: BeamShape,
    forceMap: Record<string, ForceShape[]>,
    forceAverage: number
): void => {
    const forces = forceMap[beamShape.data.id];
    if (forces) {
        const newForces: ForceShape[] = [];
        forces.forEach((forceShape) => {
            const data = forceShape.data;

            // キャンバスから集中荷重を削除
            canvas.remove(forceShape.force, forceShape.label);

            const fs = createForce(data, beamShape.points, forceAverage);
            newForces.push(fs);
            // キャンバスに追加
            canvas.add(fs.force);
            canvas.add(fs.label);
        });
        forceMap[beamShape.data.id] = newForces;
    }
};

/**
 * 集中荷重を更新する
 * @param canvas
 * @param forceShape
 * @param beamShape
 * @param forceAverage
 */
export const updateForce = (
    canvas: fabric.Canvas,
    data: Force,
    forceShape: ForceShape,
    beamShape: BeamShape,
    forceAverage: number
): void => {
    // キャンバスから集中荷重を削除
    canvas.remove(forceShape.force, forceShape.label);
    // 集中荷重を再作成
    const { force, label } = createForce(data, beamShape.points, forceAverage);
    // ForceShape にセット
    forceShape.force = force;
    forceShape.label = label;
    // キャンバスに追加
    canvas.add(force, label);
};

/**
 * 集中荷重の削除
 * (NOTE: 集中荷重の平均値を再計算すること)
 * @param canvas
 * @param beamId
 * @param force
 * @param forceMap
 */
export const removeForce = (
    canvas: fabric.Canvas,
    force: ForceShape,
    beamId: string,
    forceMap: Record<string, ForceShape[]>
): void => {
    canvas.remove(force.force, force.label);

    const forces = forceMap[beamId];
    if (forces) {
        // 削除対象の集中荷重を除外
        const list = forces.filter((shape) => shape.data.id !== force.data.id);
        forceMap[beamId] = list;
    }
};
