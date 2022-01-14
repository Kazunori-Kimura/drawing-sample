import { createContext, Dispatch, SetStateAction, useState } from 'react';
import { defaultDrawSettings, DrawSettings, NoteMode } from '../types/note';

interface Props {
    children: React.ReactNode;
}

interface INoteSettingsContext {
    mode: NoteMode;
    settings: DrawSettings;
    onChangeMode: Dispatch<SetStateAction<NoteMode>>;
    onChangeDrawSettings: Dispatch<SetStateAction<DrawSettings>>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const NoteSettingsContext = createContext<INoteSettingsContext>(undefined!);

const NoteSettingsProvider: React.VFC<Props> = ({ children }) => {
    const [mode, setMode] = useState<NoteMode>('pan');
    const [settings, setSettings] = useState<DrawSettings>(defaultDrawSettings);

    return (
        <NoteSettingsContext.Provider
            value={{ mode, settings, onChangeMode: setMode, onChangeDrawSettings: setSettings }}
        >
            {children}
        </NoteSettingsContext.Provider>
    );
};

export default NoteSettingsProvider;
