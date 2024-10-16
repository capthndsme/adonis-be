import { Card } from "react-bootstrap";
import { useEffect, useState } from "react";
import './Stat.css'; // Import custom styles for the wave

export type StatProp = {
  name: string;
  value?: number;
};

export const Stat = ({ name, value = 0 }: StatProp) => {
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    const height = Math.max(0, Math.min(100, value)); // Ensure value is between 0-100
    setFillHeight(height);
  }, [value]);

  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <Card.Header>{name}</Card.Header>
      <Card.Body style={{ position: 'relative', height: '150px', padding: '0' }}>
        <div className="wave-background" style={{ height: `${fillHeight}%` }}></div>
        <h2 style={{ 
          position: 'relative', 
          zIndex: 2, 
          textAlign: "center", 
          padding: "4px 8px", 
          margin: "0", 
          fontWeight: 300 
        }}>
          {value.toFixed(2)}%
        </h2>
      </Card.Body>
    </Card>
  );
};
