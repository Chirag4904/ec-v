# Databricks connectivity test proxy

Minimal Node + Express server that pings your Databricks SQL Warehouse and
confirms the connection works, before you wire up the real dashboard payloads.

It's the REST-API equivalent of the Python sample you were sent (same query,
same warehouse) — calls the Databricks SQL Statement Execution API directly
instead of using the Python SDK, since this is Node.

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in your real values:

```
DATABRICKS_HOST=https://adb-1476038197370632.12.azuredatabricks.net
DATABRICKS_TOKEN=<your token>
DATABRICKS_SQL_WAREHOUSE_ID=<your warehouse id>
```

**Do not** put real values in `.env.example` — that file is meant to be
committed as a template. `.env` itself is gitignored and never gets committed.

> The token pasted in the original message should be rotated in Databricks
> once you're done testing, since it was shared in plaintext in a chat.

## Run

```bash
npm start
```

You should see:

```
Databricks proxy listening on http://localhost:4000
  GET  /health            — confirms env vars are set
  GET  /test-connection   — runs the sample query against Databricks
  POST /query             — { "statement": "SELECT ..." }
```

## Test it

```bash
# 1. Confirms your .env is loaded correctly — no network call yet
curl http://localhost:4000/health

# 2. The real test — actually hits Databricks and runs the sample query
curl http://localhost:4000/test-connection
```

A working response from `/test-connection` looks like:

```json
{
  "ok": true,
  "result": {
    "statement_id": "...",
    "status": { "state": "SUCCEEDED" },
    "result": { "data_array": [ ["...", "...", "..."] ] }
  }
}
```

If something's wrong, you'll get a clear `ok: false` with the actual error —
common ones:

- **401 / 403** — token is wrong, expired, or doesn't have access to the warehouse
- **404** — `DATABRICKS_SQL_WAREHOUSE_ID` is wrong, or the table name doesn't exist
- **502 "Could not reach Databricks"** — `DATABRICKS_HOST` is wrong or unreachable
- **504 timeout** — host is reachable but not responding within 20s

## Ad-hoc queries

`POST /query` runs any statement you send it, useful while you're exploring
what tables/columns exist:

```bash
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"statement": "SHOW TABLES IN havellslakehouse_dev.bronze"}'
```

**This route is for local development only.** It lets the caller run
arbitrary SQL against your warehouse with no restrictions — don't deploy
this behind a public URL without adding auth and a query allowlist first.

## Next step

Once `/test-connection` works, the real dashboard endpoints (the ones
described in the payload spec doc) should follow the same pattern as
`runStatement()` in `server.js` — one function per dashboard section,
each running its own query and shaping the result into the JSON the
frontend expects.
