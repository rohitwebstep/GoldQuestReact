// ApiCallContext.js (or wherever you define your context)
import React, { createContext, useState, useContext } from 'react';

const ApiCallContext = createContext();

export const useApiCall = () => {
    return useContext(ApiCallContext);
};

export const ApiCallProvider = ({ children }) => {
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [isBranchApiLoading, setIsBranchApiLoading] = useState(false);

    return (
        <ApiCallContext.Provider value={{ isApiLoading, setIsApiLoading,isBranchApiLoading, setIsBranchApiLoading }}>
            {children}
        </ApiCallContext.Provider>
    );
};
