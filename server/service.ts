import config from './config'

import { createReadStream, ReadStream } from 'fs'
import fsPromises from 'fs/promises'
import { randomUUID } from 'crypto'
import { PassThrough } from 'stream'
import { join, extname } from 'path'
import childProcess from 'child_process'
import { logger } from './util'

const {
  dir: {
    publicDirectory
  },
  fallbackBitRate
} = config

export class Service {
  clientStreams: Map<any, any>

  constructor () {
    this.clientStreams = new Map()
  }

  createClientStream (): {id: string, clientStream: PassThrough} {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream (id: string): void {
    this.clientStreams.delete(id)
  }

  createFileStream (filename: string): ReadStream {
    return createReadStream(filename)
  }

  _executeSoxCommand (args: any): childProcess.ChildProcessWithoutNullStreams {
    return childProcess.spawn('sox', args)
  }

  async getBitRate (song: string): Promise<string> {
    try {
      const args = [
        '--i', // info
        '-B', // bitrate
        song
      ]
      const {
        stderr, // tudo que é erro
        stdout // tudo que é log
        // stdin // enviar dados como stream
      } = this._executeSoxCommand(args)

      const [success, error] = [stdout, stderr].map(stream => stream.read())
      if (error != null) return await Promise.reject(error)
      return success
        .toString()
        .trim()
        .replace(/k/, '000')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error(`deu ruim no bitrate: ${error}`)

      return fallbackBitRate
    }
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
