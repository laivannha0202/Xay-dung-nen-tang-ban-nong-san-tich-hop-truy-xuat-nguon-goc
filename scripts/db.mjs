import EmbeddedPostgres from 'embedded-postgres'
import { existsSync, mkdirSync } from 'node:fs'

const DATA = 'infra/pgdata'
const argv = process.argv[2]
mkdirSync(DATA, { recursive: true })
const pg = new EmbeddedPostgres({
  databaseDir: DATA, user: 'agri', password: 'agri', port: 5544, persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
})
if (argv === 'up') {
  if (!existsSync(`${DATA}/PG_VERSION`)) await pg.initialise()
  await pg.start()
  try { await pg.createDatabase('agrimarket') } catch { /* exists */ }
  console.log('postgres up on 5544')
  setInterval(() => {}, 1 << 30)
} else {
  await pg.stop()
  console.log('stopped')
}
