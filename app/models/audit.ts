import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { AuditType } from '../types/AuditType.js'

export default class Audit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare responsibleUser: number | null;

  @column()
  declare action: AuditType;

  @column()
  declare actionDescription: string | null;

  @column()
  declare optVal: string | null;


}