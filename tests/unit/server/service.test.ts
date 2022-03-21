import config from '../../../server/config'
import fs, { ReadStream } from 'fs'
import { Service } from '../../../server/service'
import TestUtil from '../_util/test-util'
import fsPromises from 'fs/promises'
import childProcess from 'child_process'

jest.mock('fs')
jest.mock('child_process')
const {
  dir: {
    publicDirectory
  },
  constants: {
    fallbackBitRate
  }
} = config

describe('#Service', () => {
  let sut: Service
  let mockReadableStream: ReadStream
  let mockSpawnResponse: childProcess.ChildProcessWithoutNullStreams
  const getSpawnResponse = ({
    stdout = '',
    stderr = '',
    stdin = () => {}
  }) => ({
    stdout: TestUtil.generateReadableStream([stdout]),
    stderr: TestUtil.generateReadableStream([stderr]),
    stdin: TestUtil.generateWritableStream(stdin)
  })
  let spawnSpy: jest.SpyInstance

  beforeAll(() => {
    mockSpawnResponse = getSpawnResponse({}) as childProcess.ChildProcessWithoutNullStreams
    mockReadableStream = TestUtil.generateReadableStream(['any_data']) as ReadStream
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadableStream)
    jest.spyOn(fsPromises, 'access').mockResolvedValue()
    spawnSpy = jest.spyOn(childProcess, 'spawn').mockReturnValue(mockSpawnResponse)
  })

  beforeEach(() => {
    sut = new Service()
  })

  describe('createClientStream() and removeClientStream()', () => {
    test('should create and remove clientStream', async () => {
      const { id } = sut.createClientStream()
      expect(sut.clientStreams.size).toBe(1)
      sut.removeClientStream(id)
      expect(sut.clientStreams.size).toBe(0)
    })
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

  describe('_executeSoxCommand()', () => {
    test('should call sox command', () => {
      const result = sut._executeSoxCommand('song_name')
      expect(result).toEqual(mockSpawnResponse)
    })
  })

  describe('getBitRate()', () => {
    test('should call sox with correct args', async () => {
      const mockSong = 'any_song'
      await sut.getBitRate(mockSong)

      expect(spawnSpy).toHaveBeenCalledWith('sox', [
        '--i',
        '-B',
        'any_song'
      ])
    })

    test('should return correct bit rate', async () => {
      const spawnResponse = getSpawnResponse({
        stdout: '  1k  '
      }) as childProcess.ChildProcessWithoutNullStreams
      jest.spyOn(
        sut,
        '_executeSoxCommand'
      ).mockReturnValueOnce(spawnResponse)
      const result = await sut.getBitRate('mockSong')
      expect(result).toBe('1000')
    })

    test('should return fallbackBitRate if sox command failed', async () => {
      const mockSong = 'any_song'
      const spawnResponse = getSpawnResponse({
        stdout: '  1k  ',
        stderr: 'any_error'
      }) as childProcess.ChildProcessWithoutNullStreams
      const spawnSpy = jest.spyOn(
        sut,
        '_executeSoxCommand'
      ).mockReturnValueOnce(spawnResponse)
      const result = await sut.getBitRate(mockSong)
      expect(result).toStrictEqual(fallbackBitRate)
      expect(spawnSpy).toHaveBeenCalledWith(['--i', '-B', 'any_song'])
    })
  })
})
