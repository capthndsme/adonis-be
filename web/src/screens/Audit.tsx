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

  useEffect(() => {
    setLoading(true)
    getAudits(selected.toISOString()).then(d => {
      setAudits(d.data)
      setLoading(false)
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
      }</>
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