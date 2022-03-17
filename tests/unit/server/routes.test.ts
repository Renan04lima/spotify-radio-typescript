import { Readable } from 'stream'
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
  let mockFileStream: Readable
  let expectedType: string

  beforeAll(() => {
    mockFileStream = TestUtil.generateReadableStream(['data'])
    expectedType = '.html'
    jest.spyOn(
      Controller.prototype,
      'getFileStream'
    ).mockResolvedValue({
      type: expectedType,
      // @ts-expect-error
      stream: mockFileStream
    })
  })

  test('GET / - should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    // @ts-expect-error
    await handler(...params.values())
    expect(params.response.writeHead).toHaveBeenCalledWith(302, {
      Location: location.home
    })
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /home - should respond with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'

    jest.spyOn(mockFileStream, 'pipe')
    // @ts-expect-error
    await handler(...params.values())
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.homeHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })

  test(`GET /controller - should respond with ${pages.controllerHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'

    jest.spyOn(mockFileStream, 'pipe')
    // @ts-expect-error
    await handler(...params.values())
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.controllerHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })

  test('GET /index.html should respond with file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/index.html'
    params.request.method = 'GET'
    params.request.url = filename

    jest.spyOn(mockFileStream, 'pipe')
    // @ts-expect-error
    await handler(...params.values())
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': CONTENT_TYPE[expectedType]
    })
  })

  test('GET /file.ext should respond with file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/file.ext'
    params.request.method = 'GET'
    params.request.url = filename
    jest.spyOn(
      Controller.prototype,
      'getFileStream'
    ).mockResolvedValue({
      type: '.ext',
      // @ts-expect-error
      stream: mockFileStream
    })
    jest.spyOn(mockFileStream, 'pipe')
    // @ts-expect-error
    await handler(...params.values())
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalled()
  })

  test('POST /unknown - given an existing route it should respond with 404', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/unknown'
    // @ts-expect-error
    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', () => {
    test('given an inexistent file it should respond with 404', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValueOnce(new Error('Error: ENOENT: no such file or directory'))
      // @ts-expect-error
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test('given an error it should return with 500', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValueOnce(new Error('Error'))
      // @ts-expect-error
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})
