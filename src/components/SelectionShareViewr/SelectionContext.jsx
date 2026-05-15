import { createContext, useContext } from "react";

export const SelectionContext = createContext(null);

export const useSelection = () => {
  const ctx = useContext(SelectionContext);
  
  if (!ctx) {
    throw new Error("useSelection must be used inside SelectionProvider");
  }
  return ctx;
};