import { handler } from './routes'
import { createServer } from 'http'

export default createServer(handler)
