import pymysql
import os

class myDbConnection:
    def __init__(self):
        self.connection = None

    def connect(self):
        self.connection = pymysql.connect(
                            host=os.getenv('DB_HOST', 'localhost'),
                            user=os.getenv('DB_USER', 'root'),
                            password=os.getenv('DB_PASSWORD', 'root'),
                            db=os.getenv('DB_NAME', 'micecatch'),
                            cursorclass=pymysql.cursors.DictCursor
                            )
        return self.connection
