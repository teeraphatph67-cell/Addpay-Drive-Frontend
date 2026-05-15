// ใน SelectionProvider.jsx
import { createContext, useContext, useState } from "react";

const SelectionContext = createContext(null);

export const useSelectionContext = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelectionContext must be used within SelectionProvider");
  }
  return context;
};

export default function SelectionProvider({ children }) {
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSelect = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.__select_id === item.__select_id);
      return exists
        ? prev.filter((i) => i.__select_id !== item.__select_id)
        : [...prev, item];
    });
  };

  const clearSelection = () => setSelectedItems([]);

  return (
    <SelectionContext.Provider
      value={{
        selectedItems,
        toggleSelect,
        clearSelection,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}