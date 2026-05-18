import { useState } from "react";

export const useToast = () => {
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const clearToast = () => setToast({ msg: "", type: "success" });

  return { toast, showToast, clearToast };
};
