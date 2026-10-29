// Local PostgreSQL adapter for the Neon query/transaction boundary. Never used by the app.
import pg from "pg";

if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL must name a disposable test database.");

export const pool = new pg.Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  application_name: "library-book-tests",
  statement_timeout: 5000,
});

export function db() {
  return {
    // Neon query objects are lazy: transaction() must execute them on one connection.
    query(text, params = []) {
      return { text, params, then: (resolve, reject) => pool.query(text, params).then((r) => r.rows).then(resolve, reject) };
    },
    async transaction(queries, { isolationLevel } = {}) {
      if (isolationLevel !== "ReadCommitted") throw new Error("Tests require explicit ReadCommitted transactions.");
      const client = await pool.connect();
      try {
        await client.query("begin isolation level read committed");
        const results = [];
        for (const { text, params } of queries) results.push((await client.query(text, params)).rows);
        await client.query("commit");
        return results;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
