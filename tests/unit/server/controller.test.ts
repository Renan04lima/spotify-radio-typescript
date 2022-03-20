import { ReadStream } from 'fs'
import { Controller } from '../../../server/controller'
import { Service } from '../../../server/service'
import TestUtil from '../_util/test-util'

describe('#Controller', () => {
  let sut: Controller
  let mockReadableStream: ReadStream

  beforeAll(() => {
    mockReadableStream = TestUtil.generateReadableStream(['any_data']) as ReadStream
    sut = new Controller()
  })

  describe('getFileStream()', () => {
    test('should return stream and type on success', async () => {
      const filename = 'file.txt'
      const getFileStreamSpy = jest.spyOn(Service.prototype, 'getFileStream').mockResolvedValue({
        stream: mockReadableStream,
        type: '.txt'
      })
      const result = await sut.getFileStream(filename)

      expect(getFileStreamSpy).toHaveBeenCalledWith(filename)
      expect(result).toEqual({
        stream: mockReadableStream,
        type: '.txt'
      })
    })
  })

  describe('handleCommand()', () => {
    test('should call service.startStreamming if command is "start"', async () => {
      const startStreammingSpy = jest.spyOn(Service.prototype, 'startStreamming')
      const result = await sut.handleCommand({ command: 'start' })
      expect(result).toEqual({ result: 'ok' })
      expect(startStreammingSpy).toHaveBeenCalledTimes(1)
    })
    test.todo('should call service.stopStreamming if command is "stop"')
  })

  describe('createClientStream()', () => {
    test.todo('should return stream and onClose on success')
  })
})
