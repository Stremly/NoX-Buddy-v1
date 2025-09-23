import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../pages/SignIn/SignIn";
import VoiceInput from '../pages/VoiceInput/VoiceInput'
import DialogInput from '../pages/DialogInput/DialogInput'


export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VoiceInput />} />
      </Routes>
    </Router>
  );
}
