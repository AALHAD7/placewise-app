import sys, psycopg
from urllib.parse import unquote
url = None
for line in open("backend/.env"):
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")
rest = url.split("://", 1)[1]
userinfo, _, hostpart = rest.rpartition("@")
user, _, pw = userinfo.partition(":")
pw = unquote(pw)
hostport, _, db = hostpart.partition("/")
db = db.split("?")[0] or "postgres"
host, _, port = hostport.partition(":")
def safe(s): return str(s).replace(pw, "***").replace(userinfo, "***")
sql = open("backend/db/migration_042_consulting_rag_v2.sql").read()
body = sql.split("-- ROLLBACK")[0]
try:
    with psycopg.connect(host=host, port=int(port or 5432), dbname=db, user=unquote(user),
                         password=pw, connect_timeout=20, sslmode="require") as conn:
        with conn.cursor() as cur:
            cur.execute("select count(*) from ingest_documents")
            doc0 = cur.fetchone()[0]
            cur.execute("select count(*) from ingest_chunks")
            c0 = cur.fetchone()[0]
            cur.execute("select count(*) from document_chunks")
            d0 = cur.fetchone()[0]
            cur.execute("select is_active, count(*) from ingest_chunks group by 1")
            active0 = cur.fetchall()

            cur.execute(body)

            cur.execute("select to_regclass('ingest_documents') is not null, to_regprocedure('match_ingest_chunks(vector,integer,text)') is not null")
            print("objects:", cur.fetchone())
            cur.execute("select domain, count(*) from ingest_documents group by 1 order by 1")
            print("domains:", cur.fetchall())

            cur.execute("select count(*) from ingest_documents")
            doc1 = cur.fetchone()[0]
            cur.execute("select count(*) from ingest_chunks")
            c1 = cur.fetchone()[0]
            cur.execute("select count(*) from document_chunks")
            d1 = cur.fetchone()[0]
            cur.execute("select is_active, count(*) from ingest_chunks group by 1")
            active1 = cur.fetchall()
            print(f"ingest_documents rows {doc0}->{doc1}, ingest_chunks rows {c0}->{c1}, document_chunks rows {d0}->{d1}")
            print(f"ingest_chunks.is_active breakdown {active0} -> {active1}")
            # Row counts must be identical, and is_active breakdown must be byte-for-byte
            # unchanged - this migration adds a column and a function, nothing else.
            if (doc0, c0, d0) != (doc1, c1, d1) or active0 != active1:
                raise SystemExit("row counts or is_active flags changed, rolled back")
        conn.commit()
        with conn.cursor() as cur:
            cur.execute("notify pgrst, 'reload schema'")
        conn.commit()
    print("APPLIED")
except Exception as e:
    print("error:", type(e).__name__, safe(str(e).split("\n")[0])[:200]); sys.exit(1)
