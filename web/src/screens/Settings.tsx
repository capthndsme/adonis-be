import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { getAllSettings, settingStrings, updateSetting, type ISettings } from "../api/settingsApi";
import { toast } from "react-toastify";

export const Settings = (): JSX.Element => {
   const [data, setData] = useState<ISettings | null>();
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function s() {
         const { data } = await getAllSettings();

         setData(data);
         setLoading(false);
      }
      s();
   }, []);

   if (loading)
      return (
         <div>
            <center>Loading...</center>
         </div>
      );
   return (
      <>
         <Card className="mt-4">
            <Card.Header>Settings</Card.Header>
            <Card.Body>
               {/** 4 cards, 2 on each row */}
               <Container>
                  <Row className="mb-2">
                     {!loading &&
                        data !== null &&
                        typeof data !== "undefined" &&
                        Object.keys(data).map((key) => {
                           return <SettingView key={key} settingKey={key as keyof ISettings} settingValue={data[key as keyof ISettings]} />;
                        })}
                  </Row>
               </Container>
            </Card.Body>
         </Card>
      </>
   );
};

export const SettingView = ({
   settingKey,
   settingValue,
}: {
   settingKey: keyof ISettings;
   settingValue: ISettings[keyof ISettings];
}) => {
   const [value, setValue] = useState(() => typeof settingValue === "number" ? settingValue * 100 : settingValue );
   const [updating, setUpdating] = useState(false);
   const setSetting = async () => {
      setUpdating(true);
      try {
         await updateSetting(settingKey, typeof value === "number" && settingKey !== "watering_duration_seconds" ? value / 100 : value);
         toast.success("Setting saved!");
      } catch (e) {
         toast.error("Error saving setting!");
      } finally {
         setUpdating(false);
      }
   };
   if (settingKey === "password") return null;
   return (
 
         <Col sm={6} lg={4} key={settingKey} className="my-3"> 
            <Card>
               <Card.Header>{settingStrings[settingKey]} </Card.Header>
               <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                <input 
                type={typeof settingValue === "number" ? "number" : "text"}
                value={value}
                className="w-100"
                onChange={(e) => setValue(e.target.value + 0)}
                />
                <div className="px-2">{settingKey === "watering_duration_seconds" ? "seconds" : "%"}</div>
                </div>
      
                {updating && <center>Updating...</center>}
                <Button onClick={setSetting} className="mt-2 w-100" variant="primary" disabled={updating}>Save</Button>
               </Card.Body>
            </Card>
         </Col>
    
   );
};
