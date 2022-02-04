import { createContext, useState } from 'react';
import { CanvasTool } from '../types/common';

interface Props {
    children: React.ReactNode;
}

interface IConfigurationContext {
    tool: CanvasTool;
    setTool: (tool: CanvasTool) => void;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const ConfigurationContext = createContext<IConfigurationContext>(undefined!);

const ConfigurationProvider: React.VFC<Props> = ({ children }) => {
    const [tool, setTool] = useState<CanvasTool>('pen');

    return (
        <ConfigurationContext.Provider value={{ tool, setTool }}>
            {children}
        </ConfigurationContext.Provider>
    );
};

export default ConfigurationProvider;
