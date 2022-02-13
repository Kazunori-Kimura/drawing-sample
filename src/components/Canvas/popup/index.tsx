import { Box } from '@mui/material';
import { useContext } from 'react';
import { PopupContext } from '../provider/PopupProvider';
import ForceEditor from './ForceEditor';
import MomentEditor from './MomentEditor';
import PinSelector from './PinSelector';
import TrapezoidEditor from './TrapezoidEditor';

const Popup: React.VFC = () => {
    const { popupType, popupPosition, popupParams, close, callback } = useContext(PopupContext);

    if (typeof popupType === 'undefined') {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                zIndex: 5000,
                ...popupPosition,
            }}
        >
            {popupType === 'forces' && (
                <ForceEditor values={popupParams ?? {}} onClose={close} onChange={callback} />
            )}
            {popupType === 'trapezoids' && (
                <TrapezoidEditor values={popupParams ?? {}} onClose={close} onChange={callback} />
            )}
            {popupType === 'nodes' && (
                <PinSelector values={popupParams ?? {}} onClose={close} onChange={callback} />
            )}
            {popupType === 'moments' && (
                <MomentEditor values={popupParams ?? {}} onClose={close} onChange={callback} />
            )}
        </Box>
    );
};

export default Popup;
