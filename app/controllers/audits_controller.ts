import type { HttpContext } from '@adonisjs/core/http'
import AuditService from '../service/AuditService.js'

export default class AuditsController {

  async getAudits({request}: HttpContext) {
    const {type, date} = request.qs()
    const data = AuditService.getAudit(type, date)
    return data;
  }
}