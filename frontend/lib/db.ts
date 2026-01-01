// lib/db.ts
// 🔵 DATABASE CONNECTION HELPER
// This file manages your PostgreSQL database connection

import { Pool } from "pg"

// Create a connection pool (reuses connections for better performance)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if can't connect
})

/**
 * Execute a SQL query
 * @param text SQL query string (use $1, $2, etc. for parameters)
 * @param params Array of parameters to safely insert into query
 * @returns Query result
 *
 * Example:
 *   const result = await query('SELECT * FROM users WHERE username = $1', ['alice'])
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const client = await pool.connect()

  try {
    const result = await client.query(text, params)
    const duration = Date.now() - start

    console.log("[DB Query]", {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount,
    })

    return result
  } catch (error) {
    console.error("[DB Error]:", {
      query: text,
      params,
      error: error.message,
    })
    throw error
  } finally {
    client.release() // Always release the client back to the pool
  }
}

/**
 * Execute multiple queries in a transaction
 * If any query fails, all changes are rolled back
 *
 * Example:
 *   await transaction(async (client) => {
 *     await client.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [50, userId])
 *     await client.query('INSERT INTO achievements (user_id, achievement_id) VALUES ($1, $2)', [userId, achievementId])
 *   })
 */
export async function transaction(callback: (client: any) => Promise<void>) {
  const client = await pool.connect()

  try {
    await client.query("BEGIN") // Start transaction
    await callback(client)
    await client.query("COMMIT") // Commit if all successful
  } catch (error) {
    await client.query("ROLLBACK") // Undo all changes if error
    console.error("[DB Transaction Error]:", error)
    throw error
  } finally {
    client.release()
  }
}

// Export the pool for advanced usage
export default pool
