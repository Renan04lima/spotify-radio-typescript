import { logger } from './util'
import server from './server'

server.listen(3000).on('listening', () => logger.info('server running'))
