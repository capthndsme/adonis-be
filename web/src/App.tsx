
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./screens/Login";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { Dashboard } from "./screens/Dashboard";
import { Settings } from "./screens/Settings";
function App() {

   return (
      <BrowserRouter>
         <AuthProvider>
            <Routes>
               <Route path="/auth/login" element={<Login />} />
               <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard/>} />
                  <Route path="/settings" element={<Settings/>} />"
               </Route>
            </Routes>
         </AuthProvider>
         <ToastContainer />
      </BrowserRouter>
   );
}

export default App;
