import { FiDownload, FiX } from "react-icons/fi";
import { useSelection } from "./SelectionContext";

export default function SelectionActionBar({ onDownload }) {
  const { selectedItems, clearSelection } = useSelection();

  if (selectedItems.length === 0) return null;
  const hasEmptyFolder = selectedItems.some(
    (i) =>
      i.type === "folder" &&
      (!i.data?.items || i.data.items.length === 0)
  );

  const disableDownload =
    selectedItems.length === 1 && hasEmptyFolder;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-lg">
        <span className="text-sm">
          กำลังเลือก <b>{selectedItems.length}</b> รายการ
        </span>

        <button
          disabled={disableDownload}
          onClick={() => {
            if (!disableDownload) {
              onDownload(selectedItems);
            }
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition
    ${disableDownload
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-500"
            }
  `}
          title={
            disableDownload
              ? "โฟลเดอร์นี้ว่างเปล่า"
              : "ดาวน์โหลด"
          }
        >
          <FiDownload />
          {disableDownload ? "โฟลเดอร์นี้ว่างเปล่า" : "ดาวน์โหลด"}
        </button>



        <button
          onClick={clearSelection}
          className="p-1.5 hover:bg-white/10 rounded"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
}
