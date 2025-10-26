import React from "react";
import { Minus, Square, X } from "lucide-react";

const TitleBar = () => {
  return (
    <div
      className="flex justify-between items-center bg-[#1e1e1e] text-white px-3 h-8 select-none shadow-md"
      style={{
        WebkitAppRegion: "drag",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      {/* Left section - App name */}
      <div className="text-xs font-light">NoX</div>

      {/* Right section - Controls */}
      <div
        className="flex items-center space-x-2"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <button
          onClick={() => window.electronAPI.minimize()}
          className="hover:bg-gray-700 rounded-sm p-1"
        >
          <Minus size={12} />
        </button>

        <button
          onClick={() => window.electronAPI.maximize()}
          className="hover:bg-gray-700 rounded-sm p-1"
        >
          <Square size={12} />
        </button>

        <button
          onClick={() => window.electronAPI.close()}
          className="hover:bg-red-600 rounded-sm p-1"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
