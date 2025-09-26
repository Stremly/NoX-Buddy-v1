// src/components/NotificationSettings.jsx
import React, { useEffect, useState } from 'react';

export default function NotificationSettings() {
  const [currentSound, setCurrentSound] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    window.electronAPI.getNotificationSound()
      .then((s) => { if (mounted) setCurrentSound(s); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const chooseFile = async () => {
    const filePath = await window.electronAPI.selectSoundFile();
    if (filePath) {
      await window.electronAPI.setNotificationSound(filePath);
      setCurrentSound(filePath);
    }
  };

  const resetSound = async () => {
    await window.electronAPI.resetNotificationSound();
    setCurrentSound(null);
  };

  const testSound = async () => {
    const res = await window.electronAPI.testNotificationSound();
    console.log("Test sound enabled: ". res);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Notification Sound</h2>
      {loading ? <p>Loading...</p> : (
        <>
          <p>Current sound: <strong>{currentSound || 'Default'}</strong></p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={chooseFile}>Choose .mp3/.wav</button>
            <button onClick={resetSound}>Reset to Default</button>
            <button onClick={testSound}>Play Test</button>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
            The selected sound will play for system notifications. Supported: .mp3, .wav
          </p>
        </>
      )}
    </div>
  );
}
