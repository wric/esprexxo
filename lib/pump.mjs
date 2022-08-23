import EventEmitter from 'events'
import { Gpio } from 'onoff'

const getGpio = pin => new Gpio(pin, 'in', 'rising')

const getRun = () => ({ started: 0, elapsed: 0, timestamp: 0 })

const parse = (prevRun, deltaNewRun) => {
  const timestamp = Date.now()
  const isNewRun = timestamp - prevRun.timestamp > deltaNewRun
  const started = isNewRun ? timestamp : prevRun.started
  const elapsed = Math.floor((timestamp - started) / emitInterval) / 10
  const shouldEmit = isNewRun || elapsed > prevRun.elapsed
  return { timestamp, started, elapsed, shouldEmit }
}

export const pump = (pin, deltaNewRun = 1000) => {
  const _pump = new EventEmitter()
  const gpio = getGpio(pin)
  let run = getRun()

  gpio.watch(error => {
    if (error) return console.error('pump', error)

    const { shouldEmit, ...parsed } = parse(run, deltaNewRun)

    if (shouldEmit) {
      run = parsed
      _pump.emit('data', parsed)
    }
  })

  process.on('SIGINT', () => {
    if (gpio) gpio.unexport()
    process.exit(0)
  })

  return _pump
}
