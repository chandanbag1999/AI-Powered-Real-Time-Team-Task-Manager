import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashbord from "../pages/Dashbord";
import AuthLayout from "../layouts/AuthLayout";



export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />} >
          <Route path="/" element={< Login />} />
          <Route path="/register" element={< Register />} />
        </Route>
        <Route path="/dashboard" element={<Dashbord />} />
      </Routes>
    </BrowserRouter>
  )
};