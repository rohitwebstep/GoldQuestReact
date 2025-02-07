import React, { createContext, useState } from 'react';


const LoaderContext = createContext();


const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export { LoaderContext, LoaderProvider };
