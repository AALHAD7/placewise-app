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
sql = open("backend/db/migration_043_restore_image_url_rpc.sql").read()
body = sql.split("-- ROLLBACK")[0]
try:
    with psycopg.connect(host=host, port=int(port or 5432), dbname=db, user=unquote(user),
                         password=pw, connect_timeout=20, sslmode="require") as conn:
        with conn.cursor() as cur:
            cur.execute("select count(*) from document_chunks")
            d0 = cur.fetchone()[0]
            cur.execute("select is_active, count(*) from document_chunks group by 1")
            active0 = cur.fetchall()

            cur.execute(body)

            cur.execute("select to_regprocedure('match_document_chunks(vector,integer,text)') is not null")
            print("function exists:", cur.fetchone())

            cur.execute("select count(*) from document_chunks")
            d1 = cur.fetchone()[0]
            cur.execute("select is_active, count(*) from document_chunks group by 1")
            active1 = cur.fetchall()
            print(f"document_chunks rows {d0}->{d1}")
            print(f"is_active breakdown {active0} -> {active1}")
            # This migration only redefines the RPC - no document_chunks row may change.
            if d0 != d1 or active0 != active1:
                raise SystemExit("row counts or is_active flags changed, rolled back")
        conn.commit()
        with conn.cursor() as cur:
            cur.execute("notify pgrst, 'reload schema'")
        conn.commit()
    print("APPLIED")
except Exception as e:
    print("error:", type(e).__name__, safe(str(e).split("\n")[0])[:200]); sys.exit(1)
