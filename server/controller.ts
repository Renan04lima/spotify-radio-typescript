import { ReadStream } from 'fs'
import { Service } from './service'

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
}
