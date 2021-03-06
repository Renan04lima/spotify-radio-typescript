import { ReadStream } from 'fs'
import { PassThrough } from 'stream'
import { Controller } from '../../../server/controller'
import { Service } from '../../../server/service'
import TestUtil from '../_util/test-util'

describe('#Controller', () => {
  let sut: Controller
  let mockReadableStream: ReadStream

  beforeAll(() => {
    mockReadableStream = TestUtil.generateReadableStream(['any_data']) as ReadStream
  })

  beforeEach(() => {
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
    test('should call service.stopStreamming if command is "stop"', async () => {
      const stopStreammingSpy = jest.spyOn(Service.prototype, 'stopStreamming')
      const result = await sut.handleCommand({ command: 'stop' })
      expect(result).toEqual({ result: 'ok' })
      expect(stopStreammingSpy).toHaveBeenCalledTimes(1)
    })

    test('should find and run other commands', async () => {
      const fxName = 'applause'
      jest.spyOn(
        Service.prototype,
        'readFxByName'
      ).mockResolvedValue(fxName)

      jest.spyOn(
        Service.prototype,
        'appendFxStream'
      ).mockReturnValue()

      const data = {
        command: 'MY_FX_NAME'
      }

      const result = await sut.handleCommand(data)
      expect(result).toStrictEqual({
        result: 'ok'
      })
      expect(Service.prototype.readFxByName).toHaveBeenCalledWith(data.command.toLowerCase())
      expect(Service.prototype.appendFxStream).toHaveBeenCalledWith(fxName)
    })

    test('should rethrow if readFxByName throws', async () => {
      const error = new Error('')
      jest.spyOn(
        Service.prototype,
        'readFxByName'
      ).mockRejectedValueOnce(error)

      const data = {
        command: 'MY_FX_NAME'
      }

      const promise = sut.handleCommand(data)
      await expect(promise).rejects.toEqual(error)
      expect(Service.prototype.readFxByName).toHaveBeenCalledWith(data.command.toLowerCase())
      expect(Service.prototype.appendFxStream).not.toHaveBeenCalled()
    })
  })

  describe('createClientStream()', () => {
    let createClientStreamSpy: jest.SpyInstance<{
      id: string
      clientStream: PassThrough
    }, []>
    let clientStream: PassThrough
    let mockId: string

    beforeAll(() => {
      mockId = 'any_id'
      clientStream = new PassThrough()
      createClientStreamSpy = jest.spyOn(Service.prototype, 'createClientStream').mockReturnValue({
        id: mockId,
        clientStream
      })
    })

    test('should return stream and onClose on success', () => {
      const result = sut.createClientStream()

      expect(result.stream).toEqual(clientStream)
      expect(result.onClose).toBeInstanceOf(Function)
      expect(createClientStreamSpy).toHaveBeenCalledTimes(1)
    })

    test('should call service.removeClientStream if onClose is called', () => {
      const removeClientStreamSpy = jest.spyOn(Service.prototype, 'removeClientStream').mockReturnValue()
      const { onClose } = sut.createClientStream()
      onClose()
      expect(removeClientStreamSpy).toHaveBeenCalledWith(mockId)
    })
  })
})
