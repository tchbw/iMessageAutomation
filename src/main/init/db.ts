import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

const sqlite = new Database(import.meta.env.MAIN_VITE_DATABASE_URL)
// @ts-expect-error Argument type mismatch
const db = drizzle({
  client: sqlite
})

export default db
