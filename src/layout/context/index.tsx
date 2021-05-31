import { createContext, ReactElement, useContext, useState } from "react";

interface UIProviderProp {
    children: ReactElement | HTMLElement
}

type ContextProp = {
    _depsLoaded?: boolean;
    setDepsLoaded?: (depsLoaded: boolean) => void;
}

const UIContext = createContext<ContextProp | undefined>(undefined);

export function useUIContext() {
    return useContext(UIContext);
}

export const UIConsumer = UIContext.Consumer;

const UIProvider = ({ children }: UIProviderProp) => {
    const [_depsLoaded, setDepsLoaded] = useState<boolean>(true);

    const value = {
        _depsLoaded,
        setDepsLoaded
    }

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export default UIProvider;