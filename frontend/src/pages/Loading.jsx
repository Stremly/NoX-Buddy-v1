import React from "react";
import Loading from "../features/Loading";

export default function LoadingScreen() {
  const { status, progress, fade } = Loading(); // get current status and progress

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      {/* Status Text */}
      <h2
        className={`text-2xl font-semibold text-blue-700 mb-6 transition-opacity duration-700 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {status}
      </h2>

      {/* Animated Progress Bar */}
      <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-700 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
