import { useEffect } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const Toast = ({ type = "success", message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-green-50",
      text: "text-green-700",
      icon: <FiCheckCircle className="text-green-500" size={20} />,
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <FiXCircle className="text-red-500" size={20} />,
    },
  };

  const s = styles[type];

  return (
    <div className="fixed top-6 right-6 z-[999] animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg ${s.bg} ${s.text}`}
      >
        {s.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
