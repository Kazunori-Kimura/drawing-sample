import { fabric } from 'fabric';
import { Force } from '../../../types/shape';
import { lerp, Vector, verticalNormalizeVector } from '../util';
import { createArrow, labelBaseProps, unresponseShapeProps } from './common';

export type ForceShape = {
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
            type: force,
            ...force,
        },
        selectable: !readonly,
        evented: !readonly,
    });

    // ラベルの基準位置
    const labelPosition = head.clone().add(dir.clone().multiplyScalar(5));

    const label = new fabric.Textbox(`${force.force} ${unit}`, {
        ...defaultForceLabelProps,
        top: labelPosition.y,
        left: labelPosition.x,
        width: Math.max(forceLength, 140),
        // デフォルトで非表示
        visible: false,
    });

    return { force: arrow, label };
};
