import { useEffect } from "react";

export default function ToggleView() {
  const toggleView = () => {
    if (window.electronAPI) {
      window.electronAPI.toggleView();
    }
  };

  return { toggleView };
}
