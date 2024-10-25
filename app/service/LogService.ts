import Audit from "#models/audit";
import { AuditType } from "../types/AuditType.js";

const createLog = (
  logType: AuditType,
  responsibleUser: number | null,
  actionDescription: string | null,
  optVal: string | null,
) => {
  const audit = new Audit();
  audit.responsibleUser = responsibleUser;
  audit.action = logType;
  audit.actionDescription = actionDescription;
  audit.optVal = optVal;
  audit.save().then(
    e => {
      console.log('audit saved', e)
    })
    .catch(e => {
      console.error('error saving audit', e)
    })
 
}

export default {
  createLog,
  LogService: {
    createLog
  }
} as const;

