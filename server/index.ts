/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { logger } from './util'
import server from './server'
import config from './config'

server().listen(config.port).on('listening', () => logger.info(`server running on port ${config.port}`))
// impede que a aplicação caia, caso um erro não tratado aconteça!
// uncaughtException => throw
// unhandledRejection => Promises
process.on('uncaughtException', (error) => logger.error(`uncaughtException happened: ${error?.stack ?? error}`))
process.on('unhandledRejection', (error) => logger.error(`unhandledRejection happened: ${error}`))
