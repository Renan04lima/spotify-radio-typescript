import fs, { ReadStream } from 'fs'
import { Service } from '../../../server/service'
import TestUtil from '../_util/test-util'

jest.mock('fs')

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
})
