import "dotenv/config";
import pg from "pg";
import { readFileSync } from "fs";

const { Pool } = pg;
// Parse connection string manually to avoid URL-encoding issues with # in password
const url = process.env.DATABASE_URL.match(
  /postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/([^?]+)/
);
const pool = new Pool({
  user: url[1],
  password: url[2],
  host: url[3],
  port: parseInt(url[4]),
  database: url[5],
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(new URL("./add_student_profiles.sql", import.meta.url), "utf8");

try {
  await pool.query(sql);
  console.log("✓ Migration successful: student_profiles table created.");
} catch (e) {
  if (e.code === "42P07") {
    console.log("✓ Table already exists — nothing to do.");
  } else {
    console.error("✗ Migration failed:", e.message);
    process.exit(1);
  }
} finally {
  await pool.end();
}
