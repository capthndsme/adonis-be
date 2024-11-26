import React from "react"

export type AuthReturn = {
  token: string,
  userId: number
}
export type Auth = {
  hash: AuthReturn | null | undefined,
  setHash: React.Dispatch<React.SetStateAction<AuthReturn | null | undefined>>
}