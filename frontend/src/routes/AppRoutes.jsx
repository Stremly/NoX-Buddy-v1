import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../pages/SignIn/SignIn";
import VoiceInput from '../pages/VoiceInput/VoiceInput'
import DialogInput from '../pages/DialogInput/DialogInput'
import InstallerScreen from '../pages/InstallerScreen/InstallerScreen'
import Settings from '../pages/Settings/Settings';


export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/installer" element={<InstallerScreen />} />
        <Route path="/signin" element={<SignIn/>} />
        <Route path='/settings' element={<Settings/>}  />
      </Routes>
    </Router>
  );
}
