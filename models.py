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




class UserLogin():
    def fromDB(self, user_id):
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"select * from users where ID_User = {user_id} limit 1")
            res = cur.fetchone()
            self.__user = res
            return self

    def create(self, user):
        self.__user = user
        return self
    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.__user['ID_User'])
