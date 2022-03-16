import { createReadStream, ReadStream } from 'fs'
import fsPromises from 'fs/promises'

import config from './config'
import { join, extname } from 'path'

const {
  dir: {
    publicDirectory
  }
} = config

export class Service {
  createFileStream (filename: string): ReadStream {
    return createReadStream(filename)
  }

  async getFileInfo (file: string): Promise<{type: string, name: string}> {
    // file = home/index.html
    const fullFilePath = join(publicDirectory, file)
    // valida se existe
    await fsPromises.access(fullFilePath)
    const fileType = extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream (file: string): Promise<{type: string, stream: ReadStream}> {
    const {
      name,
      type
    } = await this.getFileInfo(file)

    return {
      stream: this.createFileStream(name),
      type
    }
  }
}