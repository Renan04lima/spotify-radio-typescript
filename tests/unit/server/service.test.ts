import config from '../../../server/config'
import fs, { ReadStream } from 'fs'
import { Service } from '../../../server/service'
import TestUtil from '../_util/test-util'
import fsPromises from 'fs/promises'

jest.mock('fs')
const {
  dir: {
    publicDirectory
  }
} = config

describe('#Service', () => {
  let sut: Service
  let mockReadableStream: ReadStream
  beforeAll(() => {
    mockReadableStream = TestUtil.generateReadableStream(['any_data']) as ReadStream
    sut = new Service()
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadableStream)
    jest.spyOn(fsPromises, 'access').mockResolvedValue()
  })

  describe('createFileStream()', () => {
    test('should call with correct filename', async () => {
      const createReadStreamSpy = jest.spyOn(fs, 'createReadStream')
      sut.createFileStream('any_filename')
      expect(createReadStreamSpy).toHaveBeenCalledWith('any_filename')
    })

    test('should return a ReadableStream on success', async () => {
      const result = sut.createFileStream('any_filename')
      expect(result).toEqual(mockReadableStream)
    })
  })

  describe('getFileInfo()', () => {
    test('should return type and name on success', async () => {
      const file = 'any_file.txt'
      const expectedName = `${publicDirectory}/${file}`
      const result = await sut.getFileInfo(file)

      expect(result).toEqual({
        name: expectedName,
        type: '.txt'
      })
    })

    test('should rethrow if fsPromises.access throw', async () => {
      const file = 'any_file.txt'
      const error = new Error('file_not_exists')
      jest.spyOn(fsPromises, 'access').mockRejectedValueOnce(error)
      const promise = sut.getFileInfo(file)

      await expect(promise).rejects.toEqual(error)
    })
  })

  describe('getFileStream()', () => {
    test('should return type and stream on success', async () => {
      const file = 'any_file.txt'
      const result = await sut.getFileStream(file)

      expect(result).toEqual({
        stream: mockReadableStream,
        type: '.txt'
      })
    })
  })
})
