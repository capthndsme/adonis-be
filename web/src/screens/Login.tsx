import { useState } from "react";
import { Button, Card, Container, Form } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import authApi from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { baseApi } from "../api/baseApi";
import { toast } from "react-toastify";
export const Login = (): JSX.Element => {
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();
   const auth = useAuth();
   const login = async () => {
      try {
         setLoading(true);
         const result = await authApi.login(password);
         if (result.status === 201) {
            auth.setHash(result.data);
            baseApi.defaults.headers.common.Authorization = result.data;
            navigate("/");
         }
      } catch (e) {
         if (e instanceof AxiosError) {
            if (e?.response?.status === 403) {
               toast("Error logging in: Invalid Password", { type: "error" });
            } else {
               toast("Error logging in: " + e.message, { type: "error" });
            }
         } else {
            toast("Error logging in: Unknown Error", { type: "error" });
         }
      } finally {
         setLoading(false);
      }
   };
   return (
      <Container className="pt-4 max-width">
         <Card className="p-0 ">
            <Card.Header>Login to Moana</Card.Header>
            <Card.Body>
               <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" value={password} onChange={(v) => setPassword(v.currentTarget.value)} />
               </Form.Group>
            </Card.Body>
            <Card.Footer>
               <Button onClick={login} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                  Login
               </Button>
            </Card.Footer>
         </Card>
      </Container>
   );
};
