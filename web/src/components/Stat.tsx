import { Card } from "react-bootstrap";

export type StatProp = {
   name: string;
   value?: number;
};

export const Stat = ({ name, value }: StatProp) => (
   <Card>
      <Card.Header>{name}</Card.Header>
      <Card.Body>
         <h2 style={{ textAlign: "center", padding: "4px 8px", margin: "0" , fontWeight: 300}}>{value ? value.toFixed(2) : "0.00%"}%</h2>
      </Card.Body>
   </Card>
);
