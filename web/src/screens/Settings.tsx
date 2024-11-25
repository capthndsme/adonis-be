import { useEffect, useState } from "react";
import { Button, Card, Col, Container } from "react-bootstrap";
import { getAllSettings, type Setting, settingStrings, updateSetting } from "../api/settingsApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const Settings = (): JSX.Element => {
   const [data, setData] = useState<Setting | null>();
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const navigate = useNavigate();

   useEffect(() => {
      async function s() {
         const { data } = await getAllSettings();

         setData(data);
         setLoading(false);
      }
      s();
   }, []);

   if (loading || data === null || !data)
      return (
         <div>
            <center>Loading settings...</center>
         </div>
      );
   
   return (
      <Container>
         <h2 className="mt-4">Settings</h2>
         <Card className="mt-4">
            <Card.Header>Automations</Card.Header>
            <Card.Body>
               <Container>
                  <h3>Automation profiles</h3>
                  Save Configuration as Profile<br/>
                  <Button>Save</Button>
               </Container>
            </Card.Body>
         </Card>
         

         <Card className="mt-4">
            <Card.Header>General</Card.Header>
            <Card.Body>
               <Button className="w-100" onClick={() => navigate("/audit")} >Audit Log</Button>
            </Card.Body>
         </Card>
      </Container>
   );
};

 
