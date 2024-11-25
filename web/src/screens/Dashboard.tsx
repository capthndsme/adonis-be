import { useEffect, useState } from "react";

import { DashData } from "../types/DashData";
import { getPercentileData } from "../api/dashDataApi";
import { Tank } from "../components/Tank";
import pl1 from "../assets/pl1.png"
import pl2 from "../assets/pl2.png"
import { SoilMoisture } from "../components/SoilMoisture";

export const Dashboard = (): JSX.Element => {
   const [data, setData] = useState<DashData | null>();
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function fetchData() {
         try {
            const data = await getPercentileData();
            console.log("Percentile data:", data)
            setData(data);
         } catch (e) {
            console.warn(e);
         } finally {
            const s =  <SoilMoisture img={pl2} />;
            console.log(s)
            setTimeout(fetchData, 1250 + (Math.random() * 120));
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
      <div>
         <div>
            <center>
               <h1 style={{ padding: "16px", paddingBottom: 0, marginBottom:0 }}>Welcome to Moana!</h1>
               {
                  data?.ManualMode && (
                     <div style={{color: "red", fontSize: "1.25rem"}}>Manual mode enabled. Automations are ignored.</div>
                  )
               }
            </center>
         </div>
         <div className="gridMain">
            <Tank value={data?.UltrasonicA ?? 0} label="Tank 1" />
            <Tank value={data?.UltrasonicB ?? 0} label="Tank 2" />
         </div>

         <div className="gridMain">
         <SoilMoisture img={pl1} label="Row 1" hydro={data?.HydrometerA} />
         <SoilMoisture img={pl2} label="Row 2" hydro={data?.HydrometerB} />
            

         </div>
         
      </div>
   );
};
