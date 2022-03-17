/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-extraneous-class */

import { Readable, Writable } from 'stream'

export default class TestUtil {
  static generateReadableStream (data: string[]): Readable {
    return new Readable({
      read () {
        for (const item of data) {
          this.push(item)
        }

        this.push(null)
      }
    })
  }

  static generateWritableStream (onData: any): Writable {
    return new Writable({
      write (chunk, enc, cb) {
        onData(chunk)
        cb(null)
      }
    })
  }

  static defaultHandleParams (): any {
    const requestStream = TestUtil.generateReadableStream(['body da requisicao'])
    const responseStream = TestUtil.generateWritableStream(() => {})

    const data = {
      request: Object.assign(requestStream, {
        headers: {},
        method: '',
        url: ''
      }),
      response: Object.assign(responseStream, {
        writeHead: jest.fn(),
        end: jest.fn()
      })
    }

    return {
      values: () => Object.values(data),
      ...data
    }
  }
}
