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

    // init defolt. Username moana. Password $2a$10$QHbsQveqUbpu84FSol.XzODBrJ0vjxKG7SQDif2VsetHVEa/QR0I6
    await this.schema.raw(`INSERT INTO ${this.tableName} (name, username, enabled, super_admin, password) VALUES ('Moana Admin', 'moana', true, true, '$2a$10$QHbsQveqUbpu84FSol.XzODBrJ0vjxKG7SQDif2VsetHVEa/QR0I6')`)


  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}