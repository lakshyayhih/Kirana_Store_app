import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Patel9047@',
            database='abc_kirana_store_db'
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None
