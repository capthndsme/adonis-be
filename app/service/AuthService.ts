import Token from "#models/token";

class AuthService {

  async validToken(token: string|null) {
    if (!token) return false;

    const hasToken = await Token.query()
    .where('token', token)
    .first()

    return Boolean(hasToken)
  }
}

export default new AuthService();