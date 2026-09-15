import pymysql

try:
    print("Connecting to MySQL on localhost:3306 as root...")
    conn = pymysql.connect(
        host="localhost",
        port=3306,
        user="root",
        password="SIVAGOKUL@2007"
    )
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS smart_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    cursor.execute("SHOW DATABASES LIKE 'smart_attendance';")
    dbs = cursor.fetchall()
    print("MySQL Connection SUCCESSFUL! Found database:", dbs)
    conn.close()
except Exception as e:
    print("MySQL Connection FAILED:", e)
