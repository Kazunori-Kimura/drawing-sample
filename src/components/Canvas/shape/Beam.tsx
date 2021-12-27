import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Line, Text } from 'react-konva';
import { Guide } from '.';
import { CanvasTool } from '../../../types/common';
import { SelectContext } from '../provider/SelectProvider';
import { StructureContext } from '../provider/StructureProvider';
import { BeamProps, Point } from '../types';
import { createForceParams, Vector, verticalNormalizeVector } from '../util';

interface Props extends BeamProps {
    tool: CanvasTool;
    selected?: boolean;
    addForce: (point: Vector2d, vi: Vector, vj: Vector) => void;
    onDelete: VoidFunction;
    onSelect: VoidFunction;
}

const Beam: React.VFC<Props> = ({
    id,
    name,
    nodeI,
    nodeJ,
    tool,
    selected = false,
    addForce,
    onDelete,
    onSelect,
}) => {
    const [points, setPoints] = useState<number[]>([]);
    const [labelPosition, setLabelPosition] = useState<Point>([0, 0]);
    const [labelWidth, setLabelWidth] = useState(0);
    const [labelAngle, setLabelAngle] = useState(0);
    const [guidePoints, setGuidePoints] = useState<[Point, Point]>([
        [0, 0],
        [0, 0],
    ]);
    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    /**
     * beam をクリック
     * - 該当位置に集中荷重を追加する
     * - 該当要素を削除
     */
    const handleClick = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
            // 集中荷重の追加モードの場合
            if (tool === 'force') {
                // クリック位置
                const point = event.target.getStage()?.getPointerPosition();
                if (point) {
                    addForce(point, viRef.current, vjRef.current);
                    // イベントの伝播を止める
                    event.cancelBubble = true;
                }
            } else if (tool === 'delete') {
                // 梁要素の削除
                onDelete();
                // イベントの伝播を止める
                event.cancelBubble = true;
            } else if (tool === 'select') {
                // 梁要素の選択
                onSelect();
                // イベントの伝播を止める
                event.cancelBubble = true;
            }
        },
        [addForce, onDelete, onSelect, tool]
    );

    useEffect(() => {
        setPoints([nodeI.x, nodeI.y, nodeJ.x, nodeJ.y]);
        viRef.current.x = nodeI.x;
        viRef.current.y = nodeI.y;
        vjRef.current.x = nodeJ.x;
        vjRef.current.y = nodeJ.y;

        if (selected) {
            // 必ず左から右になるようにする
            let vi = viRef.current;
            let vj = vjRef.current;
            if (vi.x > vj.x) {
                [vi, vj] = [vj, vi];
            }

            // 梁要素の長さ
            const distance = vi.distance(vj);
            // 梁要素に対して垂直なベクトル
            const dir = verticalNormalizeVector(vi, vj);
            // ラベル位置
            const label = vi.clone().add(dir.clone().multiplyScalar(16));
            // ラベル方向
            const angle = vj.clone().subtract(vi).angleDeg();
            // 寸法線位置
            const guideDir = dir.clone().multiplyScalar(75);
            const guideI = vi.clone().add(guideDir);
            const guideJ = vj.clone().add(guideDir);

            setLabelWidth(distance);
            setLabelPosition([label.x, label.y]);
            setLabelAngle(angle);
            setGuidePoints([
                [guideI.x, guideI.y],
                [guideJ.x, guideJ.y],
            ]);
        }
    }, [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y, selected]);

    return (
        <>
            <Line
                id={id}
                type="beam"
                points={points}
                stroke={selected ? 'blue' : 'black'}
                strokeWidth={4}
                onClick={handleClick}
                onTap={handleClick}
            />
            {selected && (
                <>
                    {/* ラベル */}
                    <Text
                        x={labelPosition[0]}
                        y={labelPosition[1]}
                        rotation={labelAngle}
                        text={name}
                        fontSize={12}
                        width={labelWidth}
                        fill="blue"
                        align="center"
                        wrap="none"
                        ellipsis
                        listening={false}
                    />
                    {/* 寸法線 */}
                    <Guide start={guidePoints[0]} end={guidePoints[1]} />
                </>
            )}
        </>
    );
};

const ConnectedBeam: React.VFC<BeamProps> = (props) => {
    const { tool, addForce, deleteBeam } = useContext(StructureContext);
    const { isSelected, toggle } = useContext(SelectContext);

    const handleAddForce = useCallback(
        (point: Vector2d, vi: Vector, vj: Vector) => {
            const vp = new Vector(point.x, point.y);
            const force = createForceParams(props.id, vi, vj, vp);
            addForce(force);
        },
        [addForce, props.id]
    );

    const handleDelete = useCallback(() => {
        deleteBeam(props.id);
    }, [deleteBeam, props.id]);

    const handleSelect = useCallback(() => {
        toggle({ type: 'beams', id: props.id });
    }, [props.id, toggle]);

    return (
        <Beam
            {...props}
            tool={tool}
            selected={isSelected({ type: 'beams', id: props.id })}
            addForce={handleAddForce}
            onDelete={handleDelete}
            onSelect={handleSelect}
        />
    );
};

export default ConnectedBeam;
