import { Box } from '@mui/material';
import { useContext } from 'react';
import { CanvasContext } from '../provider/CanvasProvider';
import { PopupContext } from '../provider/PopupProvider';
import ForceEditor from './ForceEditor';
import PinSelector from './PinSelector';
import TrapezoidEditor from './TrapezoidEditor';

const Popup: React.VFC = () => {
    const { popupType, popupPosition, popupParams, close } = useContext(PopupContext);
    const { onChangeNode, onChangeForce, onChangeTrapezoid } = useContext(CanvasContext);

    if (typeof popupType === 'undefined') {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'absolute',
                zIndex: 5000,
                ...popupPosition,
            }}
        >
            {popupType === 'forces' && (
                <ForceEditor values={popupParams ?? {}} onClose={close} onChange={onChangeForce} />
            )}
            {popupType === 'trapezoids' && (
                <TrapezoidEditor
                    values={popupParams ?? {}}
                    onClose={close}
                    onChange={onChangeTrapezoid}
                />
            )}
            {popupType === 'nodes' && (
                <PinSelector values={popupParams ?? {}} onClose={close} onChange={onChangeNode} />
            )}
        </Box>
    );
};

export default Popup;
