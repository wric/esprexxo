const HTTP_PORT = Number(process.env.PORT) || 3000
const PUMP_PIN = Number(process.env.PUMP_PIN) || 24
const MARAX_SERIAL = process.env.MARAX_SERIAL || '/dev/serial0'

export { HTTP_PORT, MARAX_SERIAL, PUMP_PIN }
