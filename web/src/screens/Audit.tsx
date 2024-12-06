import { useEffect, useState } from "react";
import { Button, OverlayTrigger, Pagination, Popover, Table } from "react-bootstrap";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Ensure this is imported for proper styling
import { AuditText, Audit as AuditType, getAudits } from "../api/settingsApi";
import { DelayRender } from "../components/DelayRender";

export const Audit = () => {
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);
  const [audits, setAudits] = useState<AuditType[]>([]);
  // this contains the graph data
  const [statusAudits, setStatusAudits] = useState<AuditType[]>([]);

  useEffect(() => {
    const addedx = new Date()
    addedx.setUTCFullYear(selected.getFullYear())
    addedx.setDate(selected.getDate());
    addedx.setMonth(selected.getMonth());
 
    addedx.setHours(8);
    addedx.setMinutes(0);
    addedx.setSeconds(0);
    addedx.setMilliseconds(0);
    const added = addedx.toISOString()
    setLoading(true)
    getAudits(added)
    .then(d => {
      setAudits(d.data)
      setLoading(false)
    })

    getAudits(added, "STATUS_UPDATE")
    .then(d => {
      setStatusAudits(d.data)
    })
  }, [selected])
  const popover = (
    <Popover id="day-picker-popover" data-cust="true">
      <Popover.Body style={{ padding: "0px 8px" }}>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          required={true}
        />
      </Popover.Body>
    </Popover>
  );

  return (


    <>  
      <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
        <Button variant="secondary">Date: {selected.toLocaleDateString()}</Button>
      </OverlayTrigger>
      {
        loading
          ? <center>Loading Audit Log...</center>
          : <RenderAudit audits={audits.filter(a => a.action !== "STATUS_UPDATE")} />
      }
      <center>Historical sensor data</center>
      <Graph statusAudits={statusAudits} />
      </>
  );
};


const RenderAudit = ({ audits }: { audits: AuditType[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of items per page

  // Calculate indices for slicing
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAudits = audits.slice(startIndex, endIndex);

  // Calculate total pages
  const totalPages = Math.ceil(audits.length / pageSize);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <Table responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Action</th>
            <th>Action Details</th>
          </tr>
        </thead>
        <tbody>
          {currentAudits.map((audit, index) => {
            const dateLocal = new Date(audit.createdAt)
 
            const dateString = `${dateLocal.toLocaleDateString()} ${dateLocal.toLocaleTimeString()}`
            return (
             <DelayRender delay={index * 10} key={index}>
               <tr className="loader-animation fly-in">
                <td>{startIndex + index + 1}</td>
                <td>{dateString}</td>
                <td>{AuditText[audit.action]}</td>
                <td>{audit.actionDescription}</td>
              </tr>
             </DelayRender>
            )
          })}
        </tbody>
      </Table>
      <Pagination>
        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
        {Array.from({ length: totalPages }, (_, i) => (
          <Pagination.Item
            key={i + 1}
            active={i + 1 === currentPage}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    </div>
  );
};
 
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
 

interface GraphProps {
  statusAudits: AuditType[];
}

export const Graph: React.FC<GraphProps> = ({ statusAudits }) => {
    if (!statusAudits || statusAudits.length === 0) {
        return <p>No data available for the graph.</p>;
    }

    // transform the data
    const sensorData = statusAudits.map(audit => {
        try {
            const parsedOptVal = JSON.parse(audit.optVal || '{}');
            return {
                createdAt: audit.createdAt,
                ...parsedOptVal.sensors?.soilMoisture,
                mainTank: parsedOptVal.sensors?.ultrasonic?.mainTank,
                secondTank: parsedOptVal.sensors?.ultrasonic?.secondTank
            };
        } catch (error) {
            console.error("Error parsing optVal:", error);
            return null;
        }
    }).filter(Boolean);

    // check if data is empty
    if (sensorData.length === 0) {
      return <p>No valid data to display.</p>;
    }

    // Define a mapping for sensor keys to colors
    const sensorColorMap: Record<string, string> = {
        A: '#FF6384', // Example color for soilMoisture A
        B: '#36A2EB', // Example color for soilMoisture B
        mainTank: '#FFCE56',  // Example color for mainTank
        secondTank: '#4BC0C0' // Example color for secondTank
      };

    return (
    <ResponsiveContainer width="100%" height={400}>
        <LineChart
        data={sensorData}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="createdAt" tickFormatter={(timeStr) => {
              const date = new Date(timeStr);
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }} />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value === 'number') {
                    return [`${name}: ${value.toFixed(2)}`,''];
                  }
                  return [value,'']
              }}
            labelFormatter={(label) =>  {
                const date = new Date(label);
                return date.toLocaleString();
            }} />
            <Legend />
            {Object.keys(sensorData[0]).filter(key => key !== 'createdAt').map((key) => (
            <Line
              key={key}
              type="monotone"
              name={ThingToText2[key]}
              dataKey={key}
              stroke={sensorColorMap[key]}
              activeDot={{ r: 8 }}
            />
            ))}
        </LineChart>
    </ResponsiveContainer>
    );
};

export const ThingToText2: Record<string, string> = {
  "A": "Hydrometer A",
  "B": "Hydrometer B",
  "mainTank": "Main Tank",
  "secondTank": "Second Tank"

}