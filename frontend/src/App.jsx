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

  const [profileData, setProfileData] = useState({
    personal: {
      name: '',
      email: '',
      bio: '',
      secretCode: '',
      photo: null
    },
    nox: {
      noxId: '',
      noxName: 'Nox Assistant',
      noxBio: 'Your intelligent desktop companion...',
      instructions: 'Be helpful, accurate, and concise...'
    },
    usage: {
      totalHours: 0,
      memorySize: 0,
      remindersCount: 0,
      avgRuntime: 0
    }
  });

  const [userData, setUserData] = useState(null);

  return (
    <>
      <DragHandle />
      {isLoading ? (
        <AppLoader onLoadingComplete={handleLoadingComplete} setProfileData={setProfileData} setUserData={setUserData} />
      ) : (
        <Dashboard profileData={profileData} setProfileData={setProfileData} userData={userData} setUserData={setUserData}/>
      )}
    </>
  )
}

export default App
