import sqlite3


def main() -> None:
    path = r"c:\Users\User\Desktop\Medical Chatbot\instance\medical_chatbot.db"
    con = sqlite3.connect(path)
    cur = con.cursor()

    rows = cur.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()

    print("tables:", [r[0] for r in rows])
    for name, sql in rows:
        print("\n##", name)
        print(sql)
        cols = cur.execute(f"PRAGMA table_info({name})").fetchall()
        for cid, cname, ctype, notnull, dflt, pk in cols:
            print(
                f" - {cname} {ctype} notnull={notnull} dflt={dflt} pk={pk}"
            )


if __name__ == "__main__":
    main()

