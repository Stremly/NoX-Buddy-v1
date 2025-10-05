import React, { useState } from 'react';
import { AppLoader } from './components/Layout';
import { Dashboard } from './pages';
import { DragHandle } from './components/UI';

function App() {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
    console.log('Authentication completed! Loading dashboard...')
  }

  return (
    <>
      <DragHandle />
      {isLoading ? (
        <AppLoader onLoadingComplete={handleLoadingComplete} />
      ) : (
        <Dashboard />
      )}
    </>
  )
}

export default App
