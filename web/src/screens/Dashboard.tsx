import { useEffect, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { DashData } from "../types/DashData";
import { getPercentileData } from "../api/dashDataApi";
import { Stat } from "../components/Stat";
import { ThingToText } from "../components/ThingToText";

export const Dashboard = (): JSX.Element => {
   const [data, setData] = useState<DashData | null>();
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function fetchData() {
         try {
            const data = await getPercentileData();
            setData(data);
         } catch (e) {
            console.warn(e);
         } finally {
            setTimeout(fetchData, 1000);
            setLoading(false);
         }
      }
      fetchData();
   }, []);

   if (loading)
      return (
         <div>
            <center>Loading...</center>
         </div>
      );
   return (

      <Card className="mt-4">
         <Card.Header>At a glance</Card.Header>
         <Card.Body>
            {/** 4 cards, 2 on each row */}
            <Container>
               <Row>
                  {data !== null && typeof data === "object"
                     ?
                     Object.keys(data).map(
                        /** @ts-ignore we simply strongly type it, but string callback is incompatible. */
                        (key: keyof DashData) => {
                           if (key === "ManualMode" || key === "LastStates") return <></>
                           return (
                              <Col sm={6} lg={3} className="p-3" key={key}>
                                 {/** @ts-ignore somehow broken*/}
                                 <Stat key={key} name={ThingToText[key]} value={data[key]} />
                              </Col>
                           )
                        })
                     : null}
               </Row>
               <div className="text-center bolder">
                  Manual mode: {data?.ManualMode ? <span>Enabled.<br />Automations are ignored.</span> : "Disabled"}
               </div>
               <Row>
                  
               </Row>
            </Container>

         </Card.Body>
      </Card>

   );
};
