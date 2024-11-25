import Audit from "#models/audit";
import { AuditType } from "../types/AuditType.js";
import { DateTime } from 'luxon';

class AuditService {
  async getAudit(type?: AuditType, date?: string) {
    const query = Audit.query();

    if (type) {
      query.where('action', type);
    }

    if (date) {
      // Parse the date to ensure it is in valid ISO format
      const parsedDate = DateTime.fromISO(date);
      if (parsedDate.isValid) {
        // Filter where the date part matches the given date
        query.whereRaw("DATE(created_at) = ?", [parsedDate.toSQLDate()]);
      } else {
        throw new Error('Invalid date format');
      }
    }

    return await query.orderBy('id', 'desc');
  }
}

export default new AuditService();