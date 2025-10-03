import { BrowserRouter as Router, Routes, Route, HashRouter } from "react-router-dom";
import Loading from '../pages/Loading';
import Home from '../pages/Home';
import SignIn from '../pages/SignIn'

const RouterComponent =
  process.env.NODE_ENV === "production" ? HashRouter : Router;

export default function AppRoutes() {
  return (
    <RouterComponent>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/home" element={<Home/>} />
        <Route path="/signin" element={<SignIn/>}  />
      </Routes>
    </RouterComponent>
  );
}