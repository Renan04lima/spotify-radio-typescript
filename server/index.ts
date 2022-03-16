import { logger } from './util'
import server from './server'
import config from './config'

server.listen(config.port).on('listening', () => logger.info(`server running on port ${config.port}`))
