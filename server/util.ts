import pino from 'pino'

const log = pino({
  enabled: process.env.LOG_DISABLE == null,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

export const logger = log
