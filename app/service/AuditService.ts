import Audit from "#models/audit";
import { AuditType } from "../types/AuditType.js";

class AuditService {
  async getAudit(type?: AuditType) {
    const query = Audit.query()
    if (type) 
      query.where('action', type)

    return await query.orderBy('id', 'desc')
  
  }
}

export default new AuditService();