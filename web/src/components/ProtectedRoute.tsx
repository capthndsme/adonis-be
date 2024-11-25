import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar';
 

const ProtectedRoute = () => {
  const auth = useAuth();

  // show unauthorized screen if no user is found in redux store
  if (!auth.hash) {
    return (
     <Navigate to="/auth/login" replace />
    )
  }

  // returns child route elements
  return <div id="Layout">
    <NavBar /> 
    <div id="Content"><Outlet /></div>
  </div>
}
export default ProtectedRoute