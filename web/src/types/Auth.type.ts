import React from "react"

export type Auth = {
  hash: string | null | undefined,
  setHash: React.Dispatch<React.SetStateAction<string | null | undefined>>
}