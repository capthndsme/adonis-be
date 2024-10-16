import type { HttpContext } from '@adonisjs/core/http'
import TheService from '../service/TheService.js'

export default class DataController {
  async getDashData({}: HttpContext) {
    console.log('hit ')
    return TheService.getDashData()
  }
}