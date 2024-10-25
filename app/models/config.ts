import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { type Setting } from '../service/SettingsService.js'

export default class Config extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare configName: string;

  @column()
  declare configDescription: string;

  @column({
    prepare: (value: Setting) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value) as Setting
  })
  declare configJson: Setting;
  
}