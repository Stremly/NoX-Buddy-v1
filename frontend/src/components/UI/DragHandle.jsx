// DragHandle.jsx - Invisible draggable area for moving the Electron window
// Allows users to drag the window without visible controls

import React from 'react';

const DragHandle = () => {
  return (
    <div 
      className="fixed top-0 left-0 right-0 h-8 z-40 bg-transparent"
      style={{ 
        WebkitAppRegion: 'drag',
        // Make sure buttons and interactive elements can still be clicked
        pointerEvents: 'auto'
      }}
    >
      {/* Invisible draggable area */}
    </div>
  );
};

export default DragHandle;
