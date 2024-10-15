
import { Status } from "../types/Status.js"


export type BaseResponse<T> = {
  data: T
  status: Status
  error: boolean
  message: string
}


export const BaseResponse = <T>({ data, status, error, message }:  BaseResponse<T>) => ({
  data,
  status,
  error: error ?? false,
  message
})

 
