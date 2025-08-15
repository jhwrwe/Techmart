import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {env} from '@/lib/env'
import * as schema from './schema'

const client = postgres(env.DATABASE_URL, {
    max: 1,
    idle_timeout:20,
    max_lifetime:60 * 30,
})

export const db = drizzle(client, {schema})

export  type DB = typeof db