import { createError, isError, H3Error } from 'h3'

export function toH3Error(input: any): H3Error {
  if (isError(input)) return input as H3Error
  const message =
    (input && (input.message || input.statusMessage)) || 'Internal Error'
  const statusCode = (input && input.statusCode) || 500
  const statusMessage = (input && input.statusMessage) || message

  return createError({
    statusCode,
    statusMessage,
    message,
    cause: (input && input.cause) || input,
    data: input?.data
  })
}