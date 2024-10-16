import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '../service/AuthService.js';

export default class AuthController {
  async login({request, response}: HttpContext) {
    const {password} = request.body();
    
    try {
      const s = await AuthService.makeLogin(password);
      response.status(201).send(s);
    } catch (e) {
      response.status(403).send("Invalid password")
    }
    
  
  }
}