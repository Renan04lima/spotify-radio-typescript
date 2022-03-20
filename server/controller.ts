import { ReadStream } from 'fs'
import { logger } from './util'
import { Service } from './service'
import { PassThrough } from 'stream'

export class Controller {
  private readonly service: Service

  constructor () {
    this.service = new Service()
  }

  async getFileStream (filename: string): Promise<{
    type: string
    stream: ReadStream
  }> {
    return this.service.getFileStream(filename)
  }

  async handleCommand ({ command }: {command: string}): Promise<{result: string}| undefined> {
    logger.info(`command received: ${command}`)
    const result = {
      result: 'ok'
    }

    const cmd = command.toLowerCase()
    if (cmd.includes('start')) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.service.startStreamming()
      return result
    } else if (cmd.includes('stop')) {
      this.service.stopStreamming()
      return result
    } else {
      return { result: 'command invalid' }
    }
  }

  createClientStream (): {stream: PassThrough, onClose: () => void} {
    const {
      id,
      clientStream
    } = this.service.createClientStream()

    const onClose = (): void => {
      logger.info(`closing connection of ${id}`)
      this.service.removeClientStream(id)
    }

    return {
      stream: clientStream,
      onClose
    }
  }
}
