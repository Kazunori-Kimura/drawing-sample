import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Line } from 'react-konva';
import { Force } from '../../../types/shape';
import { StructureContext } from '../provider/StructureProvider';
import { BeamProps } from '../types';
import { round, Vector } from '../util';

type Props = BeamProps;

const createForceParams = (
    beam: string,
    vi: Vector,
    vj: Vector,
    vp: Vector
): Omit<Force, 'id' | 'name'> => {
    const beamLength = vi.distance(vj);
    // クリック位置までの距離
    const distance = vi.distance(vp);

    return {
        beam,
        force: 10, // TODO: どうやって指定する？
        distanceI: round(distance / beamLength),
    };
};

const Beam: React.VFC<Props> = ({ id: beam, nodeI, nodeJ }) => {
    const { tool, addForce } = useContext(StructureContext);
    const [points, setPoints] = useState<number[]>([]);
    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    /**
     * beam をクリックすると該当位置に集中荷重を追加する
     */
    const handleClick = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
            // クリック位置
            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                // 集中荷重の追加モードの場合
                if (tool === 'force') {
                    const vp = new Vector(point.x, point.y);
                    const force = createForceParams(beam, viRef.current, vjRef.current, vp);
                    // 追加
                    addForce(force);
                    // イベントの伝播を止める
                    event.cancelBubble = true;
                }
            }
        },
        [addForce, beam, tool]
    );

    useEffect(() => {
        setPoints([nodeI.x, nodeI.y, nodeJ.x, nodeJ.y]);
        viRef.current.x = nodeI.x;
        viRef.current.y = nodeI.y;
        vjRef.current.x = nodeJ.x;
        vjRef.current.y = nodeJ.y;
    }, [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y]);

    return (
        <Line
            points={points}
            stroke="black"
            strokeWidth={3}
            onClick={handleClick}
            onTap={handleClick}
        />
    );
};

export default Beam;
