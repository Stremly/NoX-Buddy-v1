import {useEffect} from 'react'
import logo from './logo.svg';
import './App.css';
import AppRoutes from './routes/AppRoutes'


function App() {
  /*useEffect(() => {
    window.notificationAPI.onExitNotification(async () => {
      // Show browser notification
      new Notification("App is quitting", {
        body: "Goodbye 👋",
      });

      // Play custom sound
      const soundPath = await window.notificationAPI.getSound();
      const audio = new Audio(`file://${soundPath}`);
      audio.play();
    });
  }, []);
  */


  return (
     <AppRoutes/>
  );
}

export default App;
