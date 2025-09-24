import { useState, useEffect, useRef } from "react";

export default function InstallerScreen() {
  const [progress, setProgress] = useState(0);
  const [autoStart, setAutoStart] = useState(true);
  const [installationComplete, setInstallationComplete] = useState(false);
  
  // Use ref to always have the latest autoStart value
  const autoStartRef = useRef(autoStart);
  autoStartRef.current = autoStart; // Update ref on every render

  useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.warn('electronAPI not available');
      // Fallback for browser
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setInstallationComplete(true);
            return 100;
          }
          return p + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    }

    const handleProgress = (value) => {
      console.log("Progress received:", value);
      setProgress(value);
    };

    const handleDone = () => {
      console.log("Installation done received");
      setProgress(100);
      setInstallationComplete(true);
      
      // Use the ref to get the latest autoStart value
      const currentAutoStart = autoStartRef.current;
      console.log("Final auto-start value:", currentAutoStart);
      
      if (window.electronAPI.setAutoStart) {
        console.log("Setting auto-start to:", currentAutoStart);
        window.electronAPI.setAutoStart(currentAutoStart);
      }
    };

    // Set up listeners
    const removeProgressListener = window.electronAPI.onInstallProgress(handleProgress);
    const removeDoneListener = window.electronAPI.onInstallDone(handleDone);

    return () => {
      if (removeProgressListener) removeProgressListener();
      if (removeDoneListener) removeDoneListener();
    };
  }, []); // Empty dependency array - effect runs only once

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-md w-[480px] p-8 text-center">
        {/* Image placeholder */}
        <div className="w-full h-48 bg-gray-300 flex items-center justify-center rounded-md mb-8">
          <span className="text-gray-700">Image/SS</span>
        </div>

        {/* Loading text */}
        <div className="flex justify-between items-center text-gray-700 text-sm mb-2">
          <span>
            {progress < 100 ? "Loading packages..." : "Installation Complete"}
          </span>
          <span>{progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-6">
          <div
            className={`h-3 transition-all duration-300 ease-in-out ${
              progress < 100 ? "bg-gray-500" : "bg-green-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Auto-start option */}
        <label className="flex items-center gap-2 text-gray-700 text-sm">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => {
              console.log("Checkbox changed to:", e.target.checked);
              setAutoStart(e.target.checked);
            }}
            disabled={installationComplete}
          />
          Start NoX automatically when system starts
        </label>
        
        {installationComplete && (
          <div className="mt-4 text-green-600 text-sm">
            Installation complete! Auto-start preference saved.
          </div>
        )}
      </div>
    </div>
  );
}