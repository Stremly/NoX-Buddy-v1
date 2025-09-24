import React, { useState } from 'react';
import { AppLoader } from './components/Layout';
import { Home } from './pages';
import { DragHandle } from './components/UI';

function App() {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
    console.log('Secret code authentication completed! Ready to launch Electron app...')
  }

  return (
    <>
      <DragHandle />
      {isLoading ? (
        <AppLoader onLoadingComplete={handleLoadingComplete} />
      ) : (
        <Home />
      )}
    </>
  )
}

export default App
