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

  beforeAll(() => {
    sut = new Service()
  })

  describe('createFileStream()', () => {
    test('should call with correct filename', async () => {
      const createReadStreamSpy = jest.spyOn(fs, 'createReadStream')
      sut.createFileStream('any_filename')
      expect(createReadStreamSpy).toHaveBeenCalledWith('any_filename')
    })

    test('should return a ReadableStream on success', async () => {
      const readableStream = TestUtil.generateReadableStream(['any_data']) as ReadStream

      jest.spyOn(fs, 'createReadStream').mockReturnValue(readableStream)
      const result = sut.createFileStream('any_filename')
      expect(result).toEqual(readableStream)
    })
  })

  describe('getFileInfo()', () => {
    test('should return type and name on success', async () => {
      const file = 'any_file.txt'
      const expectedName = `${publicDirectory}/${file}`
      jest.spyOn(fsPromises, 'access').mockResolvedValue()
      const result = await sut.getFileInfo(file)

      expect(result).toEqual({
        name: expectedName,
        type: '.txt'
      })
    })
  })
})
