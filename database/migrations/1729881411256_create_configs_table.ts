import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'configs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.string('config_name').notNullable()
      table.string('config_description').notNullable()
      table.string('config_json', 1024).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}