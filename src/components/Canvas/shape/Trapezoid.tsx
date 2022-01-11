import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Arrow, Group, Line, Text } from 'react-konva';
import { CanvasTool } from '../../../types/common';
import { Trapezoid as ITrapezoid } from '../../../types/shape';
import { PopupParams, PopupPosition } from '../popup/types';
import { PopupContext } from '../provider/PopupProvider';
import { SelectContext } from '../provider/SelectProvider';
import { StructureContext } from '../provider/StructureProvider';
import { Point, TrapezoidProps } from '../types';
import { getInsidePoints, intercectPoint, Vector, vX } from '../util';
import Guide from './Guide';

interface Props extends TrapezoidProps {
    tool: CanvasTool;
    selected?: boolean;
    onDelete: VoidFunction;
    onSelect: VoidFunction;
    onEdit: (position: PopupPosition) => void;
}

type LinePoints = [number, number, number, number];

interface LineProps {
    stroke: string;
    strokeWidth: number;
}

interface ArrowProps extends LineProps {
    pointerLength: number;
    pointerWidth: number;
    fill: string;
}

const defaultLineProps: LineProps = {
    stroke: 'pink',
    strokeWidth: 2,
};

const defaultArrowProps: ArrowProps = {
    pointerLength: 6,
    pointerWidth: 6,
    fill: 'pink',
    ...defaultLineProps,
};

interface LabelProps {
    offsetX: number;
    offsetY: number;
    fontSize: number;
    wrap: string;
    ellipsis: boolean;
}
const defaultLabelProps: LabelProps = {
    offsetX: -6,
    offsetY: 14,
    fontSize: 12,
    wrap: 'none',
    ellipsis: true,
};

interface LabelAttrs {
    x: number;
    y: number;
    text: string;
    width: number;
    rotation: number;
}

const Trapezoid: React.VFC<Props> = ({
    beam,
    forceI,
    forceJ,
    distanceI,
    distanceJ,
    angle = 90,
    isGlobal = false,
    tool,
    selected = false,
    onDelete,
    onSelect,
    onEdit,
}) => {
    // 分布荷重の矢印
    const [arrows, setArrows] = useState<LinePoints[]>([]);
    // 分布荷重の上端
    const [line, setLine] = useState<LinePoints>([0, 0, 0, 0]);
    // ラベル
    const [labelI, setLabelI] = useState<LabelAttrs>();
    const [labelJ, setLabelJ] = useState<LabelAttrs>();
    // 寸法線
    const [guidePoints, setGuidePoints] = useState<[Point, Point]>([
        [0, 0],
        [0, 0],
    ]);

    useEffect(() => {
        // 梁要素
        const { nodeI, nodeJ } = beam;
        const vI = new Vector(nodeI.x, nodeI.y);
        const vJ = new Vector(nodeJ.x, nodeJ.y);
        // 梁要素の方向
        const vd = vJ.clone().subtract(vI).normalize();
        // 分布荷重の方向
        let dir: Vector;
        if (isGlobal) {
            dir = vX.clone().rotateDeg(angle * -1);
        } else {
            dir = vd
                .clone()
                .rotateDeg(angle * -1)
                .normalize();
        }
        // 梁要素の長さ
        const beamLength = vI.distance(vJ);
        // 分布荷重の下端の位置
        const bi = vI.clone().add(vd.clone().multiplyScalar(beamLength * distanceI));
        const bj = vJ.clone().add(
            vd
                .clone()
                .invert()
                .multiplyScalar(beamLength * distanceJ)
        );
        // 分布荷重の上端の位置
        const pi = bi.clone().add(dir.clone().multiplyScalar(forceI * 10));
        const pj = bj.clone().add(dir.clone().multiplyScalar(forceJ * 10));

        // 下端を等間隔に分割する点を取得
        const points = getInsidePoints(bi, bj, vd);
        // 上端の傾き
        const slope = pj.x - pi.x !== 0 ? (pj.y - pi.y) / (pj.x - pi.x) : NaN;
        // 上端の切片
        const intercept = isNaN(slope) ? NaN : pi.y - slope * pi.x;

        // 内側の矢印
        const insideArrows: LinePoints[] = [];
        points.forEach((pd) => {
            // pd から分布荷重の方向に線を伸ばして上端と交差する点
            const pu = intercectPoint([pi, pj, slope, intercept], pd, dir);
            if (pu) {
                const arrow: LinePoints = [pu[0], pu[1], pd.x, pd.y];
                insideArrows.push(arrow);
            }
        });

        const labelAngle = dir.angleDeg();
        // ラベル (i端)
        setLabelI({
            x: bi.x,
            y: bi.y,
            text: `${forceI}kN/m`,
            width: bi.distance(pi),
            rotation: labelAngle,
        });
        // ラベル (j端)
        setLabelJ({
            x: bj.x,
            y: bj.y,
            text: `${forceJ}kN/m`,
            width: bj.distance(pj),
            rotation: labelAngle,
        });

        // 寸法線の位置
        const force = Math.max(forceI, forceJ) * 10;
        const guidePosition = dir.clone().multiplyScalar(force + 50);
        const gi = bi.clone().add(guidePosition);
        const gj = bj.clone().add(guidePosition);
        setGuidePoints([
            [gi.x, gi.y],
            [gj.x, gj.y],
        ]);

        // 上端
        setLine([pi.x, pi.y, pj.x, pj.y]);
        // 矢印
        setArrows([
            // 左端
            [pi.x, pi.y, bi.x, bi.y],
            // 内側の矢印
            ...insideArrows,
            // 右端
            [pj.x, pj.y, bj.x, bj.y],
        ]);
    }, [angle, beam, distanceI, distanceJ, forceI, forceJ, isGlobal]);

    const handleClick = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                onSelect();
            } else if (tool === 'delete') {
                onDelete();
            }
            // イベントの伝播を止める
            event.cancelBubble = true;
        },
        [onDelete, onSelect, tool]
    );

    const handleDoubleClick = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                const point = event.target.getStage()?.getPointerPosition();
                if (point) {
                    const { x, y } = point;
                    // ポップアップを開く
                    onEdit({ top: y, left: x });
                }
            }
        },
        [onEdit, tool]
    );

    const handleLabelClick = useCallback((event: KonvaEventObject<MouseEvent>) => {
        // ダブルクリック時にはクリックイベントも発生する
        // 何もバインドしていないと Stage のクリックイベント（選択解除）が発生するので
        // イベントの伝播を止めるだけのイベントハンドラを設定する
        event.cancelBubble = true;
    }, []);

    const color = useMemo(() => {
        return selected ? 'red' : 'pink';
    }, [selected]);

    return (
        <Group onClick={handleClick} onTap={handleClick}>
            {/* 上端 */}
            <Line points={line} {...defaultLineProps} stroke={color} />
            {/* 矢印 */}
            {arrows.map((arrow, index) => (
                <Arrow
                    key={`arrow_${index}`}
                    points={arrow}
                    {...defaultArrowProps}
                    stroke={color}
                    fill={color}
                />
            ))}
            {/* ラベルと寸法線 */}
            {selected && (
                <>
                    {/* I端側ラベル */}
                    <Text
                        {...defaultLabelProps}
                        {...labelI}
                        fill={color}
                        onClick={handleLabelClick}
                        onTap={handleLabelClick}
                        onDblClick={handleDoubleClick}
                        onDblTap={handleDoubleClick}
                    />
                    {/* J端側ラベル */}
                    <Text
                        {...defaultLabelProps}
                        {...labelJ}
                        fill={color}
                        onClick={handleLabelClick}
                        onTap={handleLabelClick}
                        onDblClick={handleDoubleClick}
                        onDblTap={handleDoubleClick}
                    />
                    {/* 寸法線 */}
                    <Guide start={guidePoints[0]} end={guidePoints[1]} />
                </>
            )}
        </Group>
    );
};

const ConnectedTrapezoid: React.VFC<TrapezoidProps> = (props) => {
    const { tool, deleteTrapezoid } = useContext(StructureContext);
    const { isSelected, toggle } = useContext(SelectContext);
    const { open } = useContext(PopupContext);

    const handleDelete = useCallback(() => {
        deleteTrapezoid(props.id);
    }, [deleteTrapezoid, props.id]);

    const handleSelect = useCallback(() => {
        toggle({ type: 'trapezoids', id: props.id });
    }, [props.id, toggle]);

    const handleEdit = useCallback(
        (position: PopupPosition) => {
            const trapezoid: ITrapezoid = {
                ...props,
                beam: props.beam.id,
            };
            // ポップアップを表示
            open('trapezoids', position, trapezoid as unknown as PopupParams);
        },
        [open, props]
    );

    return (
        <Trapezoid
            {...props}
            tool={tool}
            selected={isSelected({ type: 'trapezoids', id: props.id })}
            onDelete={handleDelete}
            onSelect={handleSelect}
            onEdit={handleEdit}
        />
    );
};

export default ConnectedTrapezoid;
