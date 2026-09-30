// Finds which Supabase pooler region serves this project (the direct db.* host is IPv6-only).
import { Client } from "pg";
const ref = process.env.SB_REF, pw = process.env.SB_PW;
const regions = ["ap-northeast-1","ap-northeast-2","ap-southeast-1","ap-southeast-2","ap-south-1","us-east-1","us-east-2","us-west-1","us-west-2","ca-central-1","eu-central-1","eu-central-2","eu-west-1","eu-west-2","eu-west-3","eu-north-1","sa-east-1"];
for (const prefix of ["aws-0", "aws-1"]) for (const r of regions) {
  const host = `${prefix}-${r}.pooler.supabase.com`;
  const c = new Client({ host, port: 5432, user: `postgres.${ref}`, password: pw, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000 });
  try { await c.connect(); const { rows } = await c.query("select version()"); await c.end(); console.log(`FOUND ${host} :: ${rows[0].version.slice(0, 40)}`); process.exit(0); }
  catch (e) { const m = String(e.message).replace(/\s+/g, " ").slice(0, 60); if (!/Tenant or user not found|ENOTFOUND|timeout/i.test(m)) console.log(`${host}: ${m}`); await c.end().catch(() => {}); }
}
console.log("NOT FOUND"); process.exit(1);
