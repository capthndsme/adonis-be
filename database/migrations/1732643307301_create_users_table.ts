import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.string('name').nullable()
      table.string('username').nullable().unique()
      table.boolean('enabled').defaultTo(true).nullable()
      table.boolean('super_admin').defaultTo(false).nullable()
      table.string('password').nullable()
      
    })



  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}