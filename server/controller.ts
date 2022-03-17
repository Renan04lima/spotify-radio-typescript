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
