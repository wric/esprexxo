import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import appRoot from 'app-root-path'

let db = null

const getDb = () => db ?? initDb(getDbPath(new Date()))

const getDbPath = date =>
  `${appRoot}/db/${date.toISOString().substring(0, 10)}.db`

const getDbConfig = path => ({ filename: path, driver: sqlite3.Database })

const initDb = async path => {
  db = await open(getDbConfig(path))
  await db.exec(createTablesSql)
  return db
}

export const insert = async (sql, data) => {
  const store = await getDb()
  try {
    store.run(sql, Object.values(data))
  } catch (error) {
    console.error(error)
  }
}

export const insertMaraxSql = `
INSERT INTO marax (timestamp, mode, version, steam, steamTarget, boiler, boost, heatOn)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`

export const insertPumpSql = `
INSERT INTO pump (timestamp, started, elapsed)
VALUES (?, ?, ?)
`

const createTablesSql = `
CREATE TABLE IF NOT EXISTS marax
(
  timestamp INTEGER NOT NULL,
  mode TEXT NOT NULL,
  version TEXT NOT NULL,
  steam INTEGER NOT NULL,
  steamTarget INTEGER NOT NULL,
  boiler INTEGER NOT NULL,
  boost INTEGER NOT NULL,
  heatOn INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pump
(
  timestamp INTEGER NOT NULL,
  started INTEGER NOT NULL,
  elapsed INTEGER NOT NULL
);
`
