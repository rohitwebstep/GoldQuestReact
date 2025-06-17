import React, { createContext, useContext, useState } from 'react';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const API_URL = "https://api.goldquestglobal.in";

  return (
    <ApiContext.Provider value={API_URL}>
      {children}
    </ApiContext.Provider>
  );
};
export const useApi = () => useContext(ApiContext);
