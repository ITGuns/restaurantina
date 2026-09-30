#!/usr/bin/env node
/**
 * Local Postgres helper for development.
 *   node scripts/local-db.mjs init    # create data/pg, start it on :5434 and create the `restaurantina` database
 *   node scripts/local-db.mjs start | stop | status | psql
 * Uses the Postgres binaries in $PG_BIN, a few common install locations, or whatever is on PATH.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const cmd = process.argv[2] ?? "status";
const DATA = join(process.cwd(), "data", "pg");
const LOG = join(process.cwd(), "data", "pg.log");
const PORT = process.env.PGPORT ?? "5434";
const DB = process.env.PGDATABASE ?? "restaurantina";
const candidates = [
  process.env.PG_BIN,
  "/Users/guns/Desktop/ROG files/.tools/postgres/pgsql/bin",
  "/opt/homebrew/opt/postgresql@17/bin",
  "/opt/homebrew/opt/postgresql@16/bin",
  "/opt/homebrew/opt/postgresql@15/bin",
  "/usr/local/pgsql/bin",
].filter(Boolean);

function bin(name) {
  for (const dir of candidates) {
    const p = join(dir, name);
    if (existsSync(p)) return p;
  }
  return name; // fall back to PATH
}
function run(name, args) {
  const r = spawnSync(bin(name), args, { stdio: "inherit" });
  if (r.error) {
    console.error(`${name}: ${r.error.message}. Install Postgres or set PG_BIN to its bin directory.`);
    process.exit(1);
  }
  return r.status ?? 1;
}
const start = () => run("pg_ctl", ["-D", DATA, "-o", `-p ${PORT} -k /tmp`, "-l", LOG, "start"]);

switch (cmd) {
  case "init": {
    if (!existsSync(DATA)) run("initdb", ["-D", DATA, "-U", "postgres", "--auth=trust", "-E", "UTF8", "--no-locale"]);
    start();
    run("createdb", ["-h", "localhost", "-p", PORT, "-U", "postgres", DB]);
    console.log(`\nPostgres is running on localhost:${PORT}, database "${DB}". DATABASE_URL=postgresql://postgres@localhost:${PORT}/${DB}`);
    break;
  }
  case "start":
    process.exit(start());
  case "stop":
    process.exit(run("pg_ctl", ["-D", DATA, "stop"]));
  case "status":
    process.exit(run("pg_ctl", ["-D", DATA, "status"]));
  case "psql":
    process.exit(run("psql", ["-h", "localhost", "-p", PORT, "-U", "postgres", "-d", DB]));
  default:
    console.log("usage: node scripts/local-db.mjs init|start|stop|status|psql");
}
