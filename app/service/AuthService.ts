import Token from "#models/token";
import { Bcrypt } from "@adonisjs/core/hash/drivers/bcrypt";
import SettingsService from "./SettingsService.js";
import { randomBytes } from "crypto";

class AuthService {

  readonly #bcrypt = new Bcrypt({})

  async validToken(token: string|null) {
    if (!token) return false;

    const hasToken = await Token.query()
    .where('token', token)
    .first()

    return Boolean(hasToken)
  }

  async makeLogin(password: string) {
    const setting = SettingsService.getSettings().password;
    const valid = await this.#bcrypt.verify(setting, password );
    if (valid) {
      console.log("login success - make token")
      const nTk = randomBytes(36).toString('hex');
      await Token.create({
        token: nTk
      })
      return nTk;
    } else {
      throw new Error("Invalid password")
    }
  }
}

export default new AuthService();