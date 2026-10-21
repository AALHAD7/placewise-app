import sys, psycopg
from urllib.parse import unquote
url = None
for line in open("backend/.env"):
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")
rest = url.split("://", 1)[1]
userinfo, _, hostpart = rest.rpartition("@")          # last @ separates credentials from host
user, _, pw = userinfo.partition(":")
pw = unquote(pw)
hostport, _, db = hostpart.partition("/")
db = db.split("?")[0] or "postgres"
host, _, port = hostport.partition(":")
def safe(s): return str(s).replace(pw, "***").replace(userinfo, "***")
sql = open("backend/db/migration_041_ingest_review_queue.sql").read()
body = sql.split("-- ROLLBACK")[0]
try:
    with psycopg.connect(host=host, port=int(port or 5432), dbname=db, user=unquote(user),
                         password=pw, connect_timeout=20, sslmode="require") as conn:
        with conn.cursor() as cur:
            cur.execute("select count(*) from ingest_pages"); p0 = cur.fetchone()[0]
            cur.execute("select count(*) from ingest_chunks"); c0 = cur.fetchone()[0]
            cur.execute("select count(*) from document_chunks"); d0 = cur.fetchone()[0]
            cur.execute(body)
            cur.execute("select to_regclass('ingest_page_reviews'), to_regclass('ingest_page_findings'), to_regprocedure('ingest_review_page') is not null or exists(select 1 from pg_proc where proname='ingest_review_page')")
            print("objects:", cur.fetchone())
            cur.execute("select ingestion_version, count(*) from ingest_documents group by 1")
            print("versions:", cur.fetchall())
            cur.execute("select count(*) from ingest_pages"); p1 = cur.fetchone()[0]
            cur.execute("select count(*) from ingest_chunks"); c1 = cur.fetchone()[0]
            cur.execute("select count(*) from document_chunks"); d1 = cur.fetchone()[0]
            print(f"pages {p0}->{p1}, chunks {c0}->{c1}, document_chunks {d0}->{d1}")
            if (p0, c0, d0) != (p1, c1, d1): raise SystemExit("row counts changed, rolled back")
        conn.commit()
        with conn.cursor() as cur:
            cur.execute("notify pgrst, 'reload schema'")
        conn.commit()
    print("APPLIED")
except Exception as e:
    print("error:", type(e).__name__, safe(str(e).split("\n")[0])[:200]); sys.exit(1)
