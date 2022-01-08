import { useContext } from 'react';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import CanvasToolbox from './CanvasToolbox';
import NoteToolbox from './NoteToolbox';

const Toolbox: React.VFC = () => {
    const { mode } = useContext(AppSettingsContext);
    if (mode === 'canvas') {
        return <CanvasToolbox />;
    }
    return <NoteToolbox />;
};

export default Toolbox;
