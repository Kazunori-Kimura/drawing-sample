/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';

// https://github.com/pmndrs/drei/blob/master/src/core/useContextBridge.tsx
export const useContextBridge = (...contexts: Array<React.Context<any>>) => {
    const cRef = React.useRef<Array<React.Context<any>>>([]);
    cRef.current = contexts.map((context) => React.useContext(context));

    return React.useMemo(
        () =>
            ({ children }: { children: React.ReactNode }): JSX.Element =>
                contexts.reduceRight(
                    (acc, Context, i) => (
                        <Context.Provider value={cRef.current[i]} children={acc} />
                    ),
                    children
                ) as unknown as JSX.Element,
        [contexts]
    );
};
