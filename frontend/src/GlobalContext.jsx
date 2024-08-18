import React, { createContext, useContext, useState } from 'react';

// Create the context
export const GlobalContext = createContext();

// Create a provider component
export const GlobalProvider = ({ children }) => {
  const [globalState, setGlobalState] = useState(null);

  return (
    <GlobalContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook for consuming the context
export const useGlobalState = () => useContext(GlobalContext);
