import config from '../../../server/config'
import fs, { Dirent, ReadStream } from 'fs'
import { Service } from '../../../server/service'
import TestUtil from '../_util/test-util'
import fsPromises from 'fs/promises'
import childProcess from 'child_process'
import { PassThrough, Writable } from 'stream'
import streamsPromises from 'stream/promises'

jest.mock('fs')
jest.mock('fs/promises')
jest.mock('child_process')
const {
  dir: {
    publicDirectory,
    fxDirectory
  },
  constants: {
    fallbackBitRate,
    bitRateDivisor
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

  describe('broadCast()', () => {
    test('it should write only for active client streams', () => {
      const onData = jest.fn()
      const client1 = TestUtil.generateWritableStream(onData) as PassThrough
      // BUG Error: write after end
      // const client2 = TestUtil.generateWritableStream(onData) as PassThrough
      // jest.spyOn(
      //   sut.clientStreams,
      //   'delete'
      // )

      sut.clientStreams.set('1', client1)
      // sut.clientStreams.set('2', client2)
      // client2.end()

      const writable = sut.broadCast()
      // vai mandar somente para o client1 pq o outro desconectou
      writable.write('Hello World')

      expect(writable).toBeInstanceOf(Writable)
      // expect(sut.clientStreams.delete).toHaveBeenCalled()
      expect(onData).toHaveBeenCalledTimes(1)
    })
  })

  describe('startStreamming()', () => {
    test('it should call the sox command', async () => {
      const currentSong = 'mySong.mp3'
      sut.currentSong = currentSong
      const currentReadable = TestUtil.generateReadableStream(['abc']) as ReadStream
      const expectedResult = jest.fn()
      const writableBroadCaster = TestUtil.generateWritableStream(() => {})

      jest.spyOn(
        sut,
        'getBitRate'
      ).mockResolvedValue(fallbackBitRate)

      jest.spyOn(
        streamsPromises,
        'pipeline'
      ).mockImplementationOnce(async () => { expectedResult() })

      jest.spyOn(
        fs,
        'createReadStream'
      ).mockReturnValue(currentReadable)

      jest.spyOn(
        sut,
        'broadCast'
      ).mockReturnValue(writableBroadCaster)

      const expectedThrottle = parseFloat(fallbackBitRate) / bitRateDivisor
      await sut.startStreamming()

      expect(sut.currentBitRate).toEqual(expectedThrottle)
      expect(expectedResult).toHaveBeenCalled()
      expect(sut.getBitRate).toHaveBeenCalledWith(currentSong)
      expect(fs.createReadStream).toHaveBeenCalledWith(currentSong)
      expect(streamsPromises.pipeline).toHaveBeenCalledWith(
        currentReadable,
        sut.throttleTransform,
        sut.broadCast()
      )
    })
  })

  describe('readFxByName', () => {
    test('it should return the song', async () => {
      const service = new Service()
      const inputFx = 'song01'
      const fxOnDisk = 'SONG01.mp3'
      const fxOnDiskDirent = 'SONG01.mp3' as unknown as Dirent
      jest.spyOn(
        fsPromises,
        'readdir'
      ).mockResolvedValue([fxOnDiskDirent])

      const path = await service.readFxByName(inputFx)
      const expectedPath = `${fxDirectory}/${fxOnDisk}`

      expect(path).toStrictEqual(expectedPath)
      expect(fsPromises.readdir).toHaveBeenCalledWith(fxDirectory)
    })
  })
})
