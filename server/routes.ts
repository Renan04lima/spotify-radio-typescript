import { IncomingMessage, ServerResponse } from 'http'

export function handler (req: IncomingMessage, res: ServerResponse): ServerResponse {
  return res.end('hello')
}
