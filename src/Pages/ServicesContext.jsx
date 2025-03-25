import React, { createContext, useContext, useState } from 'react';

// Create the context with the name 'bane'
const ServicesContext = createContext();

// Provider component to wrap your app and provide the context value
export const ServicesProvider = ({ children }) => {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <ServicesContext.Provider value={{ selectedService, setSelectedService }}>
      {children}
    </ServicesContext.Provider>
  );
};

// Custom hook to use the Bane context
export const useService = () => useContext(ServicesContext);