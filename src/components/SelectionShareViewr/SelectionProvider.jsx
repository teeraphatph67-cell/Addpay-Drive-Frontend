import { useState } from "react";
import { SelectionContext } from "./SelectionContext";

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
