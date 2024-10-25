import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.integer('responsible_user').nullable()
      table.string('action').notNullable()
      table.string('action_description', 1024).nullable()
      table.string('opt_val', 1024).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}