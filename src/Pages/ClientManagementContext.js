import React, { createContext, useContext, useState } from "react";


const ClientManagementContext = createContext();


export const useClient = () => useContext(ClientManagementContext);


export const ClientProvider = ({ children }) => {
  const [clientData, setClientData] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [validationsErrors, setValidationsErrors] = useState({});

  return (
    <ClientManagementContext.Provider value={{ clientData, admins, setAdmins, setClientData, validationsErrors, setValidationsErrors }}>
      {children}
    </ClientManagementContext.Provider>
  );
};
