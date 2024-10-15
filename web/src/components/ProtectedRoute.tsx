import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar';
import { Container } from 'react-bootstrap';


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
    <Container id="Content"><Outlet /></Container>
  </div>
}
export default ProtectedRoute