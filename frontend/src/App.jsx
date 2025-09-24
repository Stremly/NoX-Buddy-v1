import { useState } from 'react'
import AppLoader from './components/AppLoader'
import Homepage from './components/Homepage'
import DragHandle from './components/DragHandle'

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
        <Homepage />
      )}
    </>
  )
}

export default App
