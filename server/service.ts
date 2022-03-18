import config from './config'
import { logger } from './util'

import { createReadStream, ReadStream } from 'fs'
import fsPromises from 'fs/promises'
import { randomUUID } from 'crypto'
import { PassThrough, PipelinePromise, Writable } from 'stream'
import { join, extname } from 'path'
import childProcess from 'child_process'
import Throttle from 'throttle'
import streamsPromises from 'stream/promises'
import { once } from 'events'
const {
  dir: {
    publicDirectory
  },
  englishConversation,
  fallbackBitRate,
  bitRateDivisor
} = config

export class Service {
  readonly clientStreams: Map<string, PassThrough>
  readonly currentSong: string
  currentBitRate: number
  throttleTransform: Throttle
  currentReadable: ReadStream

  constructor () {
    this.clientStreams = new Map()
    this.currentSong = englishConversation
    this.currentBitRate = 0
    this.throttleTransform = {} as unknown as Throttle
    this.currentReadable = {} as unknown as ReadStream
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

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable')
      ])

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

  broadCast (): Writable {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [id, stream] of this.clientStreams) {
          // se o cliente descontou não devemos mais mandar dados pra ele
          if (stream.writableEnded != null) {
            this.clientStreams.delete(id)
            continue
          }

          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreamming (): Promise<PipelinePromise<any>> {
    logger.info(`starting with ${this.currentSong}`)
    const bitRate = this.currentBitRate = parseFloat(await this.getBitRate(this.currentSong)) / bitRateDivisor
    const throttleTransform = this.throttleTransform = new Throttle(bitRate)
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)
    return streamsPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadCast()
    )
  }

  stopStreamming (): void {
    this.throttleTransform?.end?.()
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
