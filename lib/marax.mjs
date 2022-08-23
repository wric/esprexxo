import EventEmitter from 'events'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'

const getOptions = path => ({ path, baudRate: 9600 })

const getParser = () => new ReadlineParser({ delimiter: '\r\n' })

const getSerial = path => new SerialPort(getOptions(path)).pipe(getParser())

const parse = data => {
  const metrics = data.split(',')

  return {
    timestamp: Date.now(),
    mode: metrics[0].slice(0, 1),
    version: metrics[0].slice(1),
    steam: Number(metrics[1]),
    steamTarget: Number(metrics[2]),
    boiler: Number(metrics[3]),
    boost: Number(metrics[4]),
    heatOn: Number(metrics[5][0])
  }
}

export const marax = path => {
  const _marax = new EventEmitter()
  const serial = getSerial(path)

  serial.on('data', data => {
    const parsed = parse(data)
    _marax.emit('data', parsed)
  })

  return _marax
}
