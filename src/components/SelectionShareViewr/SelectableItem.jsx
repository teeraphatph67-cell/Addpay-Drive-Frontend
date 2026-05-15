import { useSelection } from "./SelectionContext";

export default function SelectableItem({ id, item, children }) {
  const { selectedItems, toggleSelect } = useSelection();

  const isSelected = selectedItems.some(
    (i) => i.__select_id === id
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggleSelect({
          __select_id: id,
          ...item,
        });
      }}
      className={`relative rounded-lg
        ${isSelected ? "ring-2 ring-sky-500 bg-sky-50" : ""}
      `}
    >
      {children}
    </div>
  );
}
