
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
 
import { BaseResponse } from '../response/BaseResponse.js';
import { Status } from '../types/Status.js';
import AuthService from '../service/AuthService.js';
 




export default class AuthServiceMiddleware {

 



  async handle(ctx: HttpContext, next: NextFn) {
    console.log("HANDLE is called");
    /**
     * Middleware logic goes here (before the next call)
     */
    const validate = await AuthService.validToken(
      ctx.request.header("Authorization")?.replace("Bearer ", "") ?? ""
    );
    if (validate) {
      console.log("Called")
      return next();
    } else {

      ctx.response.status(401).send(BaseResponse({
        data: null,
        message: "Invalid access",
        status: Status.INVALID_ACCESS,
        error: true
      }))
    }
  }

}