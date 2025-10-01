import React from "react";
import ToggleView from "../features/ToggleView";

export default function Home() {
  const { toggleView } = ToggleView();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start py-12 px-6">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-semibold text-blue-900">NoX-Buddy</h1>
        <button
          onClick={toggleView}
          className="px-4 py-2 rounded-md bg-blue-800 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Toggle View
        </button>
      </header>

      {/* Main content */}
      <main className="w-full max-w-4xl bg-blue-50 rounded-lg shadow-md p-8 flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold text-blue-900 mb-4">
          Welcome to the Homepage
        </h2>
        <p className="text-blue-800 text-lg">
          Backend is successfully connected. All systems are running smoothly.
        </p>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-sm text-blue-700">
        © 2025 NoX-Buddy. All rights reserved.
      </footer>
    </div>
  );
}
