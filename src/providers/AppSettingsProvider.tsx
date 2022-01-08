import { createContext, Dispatch, SetStateAction, useState } from 'react';
import { AppMode } from '../types/common';

interface Props {
    children: React.ReactNode;
}

interface IAppSettingsContext {
    mode: AppMode;
    onChangeMode: Dispatch<SetStateAction<AppMode>>;
    selectedCanvasIndex?: number;
    onSelectCanvas: Dispatch<SetStateAction<number | undefined>>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const AppSettingsContext = createContext<IAppSettingsContext>(undefined!);

const AppSettingsProvider: React.VFC<Props> = ({ children }) => {
    const [mode, setMode] = useState<AppMode>('note');
    const [selectedCanvasIndex, setCanvasIndex] = useState<number>();

    return (
        <AppSettingsContext.Provider
            value={{
                mode,
                onChangeMode: setMode,
                selectedCanvasIndex,
                onSelectCanvas: setCanvasIndex,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
};

export default AppSettingsProvider;
