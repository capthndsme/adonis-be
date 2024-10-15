import { AiOutlineHome, AiOutlineLogout, AiOutlineSetting } from "react-icons/ai";
import { NavButton } from "./NavButton";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";

const NavBar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const logout = () => {
    auth.setHash(null);
    navigate("/auth/login")
  }
   return (
      <div id="Nav">
         <Container id="NavInternal">
            <div id="NavTitle">Moana Pi</div>
            <div id="NavButtons">
               <NavButton link="/" text="Home">
                  <AiOutlineHome />
               </NavButton>
               <NavButton link="/settings" text="Settings">
                  <AiOutlineSetting />
               </NavButton>
               <NavButton action={logout} text="Logout">
                  <AiOutlineLogout />
               </NavButton>
            </div>
         </Container>
      </div>
   );
};

export default NavBar;
