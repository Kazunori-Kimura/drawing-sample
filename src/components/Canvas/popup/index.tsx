import { useCallback, useContext, useMemo } from 'react';
import { Html } from 'react-konva-utils';
import { Force, Node, Trapezoid } from '../../../types/shape';
import { PopupContext } from '../provider/PopupProvider';
import { StructureContext } from '../provider/StructureProvider';
import { clone } from '../util';
import ForceEditor from './ForceEditor';
import PinSelector from './PinSelector';
import TrapezoidEditor from './TrapezoidEditor';

const Popup: React.VFC = () => {
    const { popupType, popupPosition, popupParams, close } = useContext(PopupContext);
    const { setStructure } = useContext(StructureContext);

    const divProps = useMemo(() => {
        const { top, left } = popupPosition;
        return {
            style: {
                zIndex: 5000,
                top: `${top}px`,
                left: `${left}px`,
            },
        };
    }, [popupPosition]);

    const handleChangeForce = useCallback(
        (force: Force) => {
            setStructure &&
                setStructure((structure) => {
                    const data = clone(structure);

                    const index = data.forces.findIndex(({ id }) => id === force.id);
                    if (index >= 0) {
                        data.forces[index] = {
                            ...force,
                        };
                    }

                    return data;
                });
        },
        [setStructure]
    );

    const handleChangeTrapezoid = useCallback(
        (trapezoid: Trapezoid) => {
            setStructure &&
                setStructure((structure) => {
                    const data = clone(structure);
                    const index = data.trapezoids.findIndex(({ id }) => id === trapezoid.id);
                    if (index >= 0) {
                        data.trapezoids[index] = {
                            ...trapezoid,
                        };
                    }
                    return data;
                });
        },
        [setStructure]
    );

    const handleChangeNode = useCallback(
        (node: Node) => {
            setStructure &&
                setStructure((structure) => {
                    const data = clone(structure);
                    const index = data.nodes.findIndex(({ id }) => id === node.id);
                    if (index >= 0) {
                        data.nodes[index] = {
                            ...node,
                        };
                    }
                    return data;
                });
        },
        [setStructure]
    );

    if (typeof popupType === 'undefined') {
        return null;
    }

    return (
        <Html divProps={divProps}>
            {popupType === 'forces' && (
                <ForceEditor
                    values={popupParams ?? {}}
                    onClose={close}
                    onChange={handleChangeForce}
                />
            )}
            {popupType === 'trapezoids' && (
                <TrapezoidEditor
                    values={popupParams ?? {}}
                    onClose={close}
                    onChange={handleChangeTrapezoid}
                />
            )}
            {popupType === 'nodes' && (
                <PinSelector
                    values={popupParams ?? {}}
                    onClose={close}
                    onChange={handleChangeNode}
                />
            )}
        </Html>
    );
};

export default Popup;
