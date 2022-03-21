import { ReadStream } from 'fs'
import { PassThrough } from 'stream'
import config from '../../../server/config'
import { Controller } from '../../../server/controller'
import { handler } from '../../../server/routes'
import TestUtil from '../_util/test-util'

const {
  pages,
  location,
  constants: {
    CONTENT_TYPE
  }
} = config

describe('#Routes - test suite for API response', () => {
  let mockFileStream: ReadStream
  let expectedType: string

  beforeAll(() => {
    mockFileStream = TestUtil.generateReadableStream(['data']) as ReadStream
    expectedType = '.html'
    jest.spyOn(
      Controller.prototype,
      'getFileStream'
    ).mockResolvedValue({
      type: expectedType,
      stream: mockFileStream
    })
  })

  test('GET / - should redirect to home page', async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    request.method = 'GET'
    request.url = '/'

    await handler(request, response)
    expect(response.writeHead).toHaveBeenCalledWith(302, {
      Location: location.home
    })
    expect(response.end).toHaveBeenCalled()
  })

  test(`GET /home - should respond with ${pages.homeHTML} file stream`, async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    request.method = 'GET'
    request.url = '/home'

    jest.spyOn(mockFileStream, 'pipe')
    await handler(request, response)
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.homeHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(response)
  })

  test(`GET /controller - should respond with ${pages.controllerHTML} file stream`, async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    request.method = 'GET'
    request.url = '/controller'

    jest.spyOn(mockFileStream, 'pipe')

    await handler(request, response)
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.controllerHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(response)
  })

  test('GET /index.html should respond with file stream', async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    const filename = '/index.html'
    request.method = 'GET'
    request.url = filename

    jest.spyOn(mockFileStream, 'pipe')

    await handler(request, response)
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(response)
    expect(response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': CONTENT_TYPE[expectedType]
    })
  })

  test('GET /file.ext should respond with file stream', async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    const filename = '/file.ext'
    request.method = 'GET'
    request.url = filename
    jest.spyOn(
      Controller.prototype,
      'getFileStream'
    ).mockResolvedValue({
      type: '.ext',
      stream: mockFileStream
    })
    jest.spyOn(mockFileStream, 'pipe')

    await handler(request, response)
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(response)
    expect(response.writeHead).not.toHaveBeenCalled()
  })

  test('POST /unknown - given a non-existing route, it should respond with 404', async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    request.method = 'POST'
    request.url = '/unknown'

    await handler(request, response)

    expect(response.writeHead).toHaveBeenCalledWith(404)
    expect(response.end).toHaveBeenCalled()
  })

  test('GET undefined - given an undefined url, it should respond with 400', async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    request.method = 'GET'
    request.url = undefined

    await handler(request, response)

    expect(response.writeHead).toHaveBeenCalledWith(400)
    expect(response.end).toHaveBeenCalled()
  })

  test('GET /stream?id=123 - should call createClientStream', async () => {
    const { request, response } = TestUtil.defaultHandleParams()

    request.method = 'GET'
    request.url = '/stream'
    const stream = TestUtil.generateReadableStream(['test']) as PassThrough
    jest.spyOn(
      stream,
      'pipe'
    )

    const onClose = jest.fn()
    jest.spyOn(
      Controller.prototype,
      'createClientStream'
    )
      .mockReturnValue({
        onClose,
        stream
      })

    await handler(request, response)
    request.emit('close')

    expect(response.writeHead).toHaveBeenCalledWith(
      200, {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      }
    )

    expect(Controller.prototype.createClientStream).toHaveBeenCalled()
    expect(stream.pipe).toHaveBeenCalledWith(response)
    expect(onClose).toHaveBeenCalled()
  })

  test('POST /controller - should call handleCommand', async () => {
    const { request, response } = TestUtil.defaultHandleParams()
    request.method = 'POST'
    request.url = '/controller'
    const body = {
      command: 'start'
    }
    request.push(JSON.stringify(body))

    const jsonResult = {
      result: 'ok'
    }
    jest.spyOn(
      Controller.prototype,
      'handleCommand'
    )
      .mockResolvedValue(jsonResult)

    await handler(request, response)

    expect(Controller.prototype.handleCommand).toHaveBeenCalledWith(body)
    expect(response.end).toHaveBeenCalledWith((JSON.stringify(jsonResult)))
  })

  describe('exceptions', () => {
    test('given an inexistent file it should respond with 404', async () => {
      const { request, response } = TestUtil.defaultHandleParams()
      request.method = 'GET'
      request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValueOnce(new Error('Error: ENOENT: no such file or directory'))

      await handler(request, response)

      expect(response.writeHead).toHaveBeenCalledWith(404)
      expect(response.end).toHaveBeenCalled()
    })

    test('given an error it should return with 500', async () => {
      const { request, response } = TestUtil.defaultHandleParams()
      request.method = 'GET'
      request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValueOnce(new Error('Error'))

      await handler(request, response)

      expect(response.writeHead).toHaveBeenCalledWith(500)
      expect(response.end).toHaveBeenCalled()
    })
  })
})
