import http
import json
import os

import pymysql
from flask import Flask, render_template, request, redirect, make_response
app = Flask(__name__)


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



@app.route('/catches',methods=['GET'])
def allCatches():
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute('select * from catch')
        catches = cur.fetchall()

        if request.method == 'GET':
            #return catches
            return render_template("index.html", catches=catches)

@app.route('/docker-test', methods=['GET'])
def dockertest():
    return "<p>it works!</p>"

@app.route('/catches/<int:year>/<int:month>', methods=['GET'])
def sortCatches(year, month):
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute(f"select * from catch where YEAR(Date) = {year} and MONTH(Date) = {month}")
        default = "Ничего не найдено"
        catches = cur.fetchall()
        if len(catches) == 0:
            return default
        else:
            return catches

@app.route('/catchDetails/<int:catchID>', methods=['GET'])
def catchDetails(catchID):
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute(f"SELECT ID_Catch, Date, zones.Name as Zone, stations.Name as Station, "
                    f"Biotope, Place, Coords_X, Coords_Y, Traps_Amount, Catched_Amount, Comments"
                    f" FROM `catch` left join zones on catch.Zone_ID = zones.ID_Zone "
                    f"left join stations on catch.Station_ID = stations.ID_Station WHERE ID_Catch = {catchID}")
        catch = cur.fetchone()
        return render_template('catchDetails.html', catch=catch)

@app.route('/mice/<int:catchID>', methods=['GET'])
def miceInCatch(catchID):
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute(f"SELECT ID_Mouse, types.Name as Type, pregnancies.Name as Pregnancy, Gender, Age, Embryos_Amount, "
                    f"diseases.Name as Disease from mouse "
                    f"left join diseases on mouse.ID_Disease = diseases.Disease_ID "
                    f"left join types on mouse.Type_ID = types.ID_Type "
                    f"left join pregnancies on mouse.Pregnancy_ID = pregnancies.ID_Pregnancy "
                    f"where mouse.Catch_ID = {catchID}")
        mice = cur.fetchall()
        default = "Информация об отловленных еще не добавлена"
        if len(mice) == 0:
            return default
        else:
            return mice

@app.route('/addCatch', methods=['GET', 'POST'])
def addCatch():
    if request.method == 'GET':
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"select * from stations")
            stations = cur.fetchall()
            cur.execute(f"select * from zones")
            zones = cur.fetchall()
            return render_template("addCatch.html", zones=zones, stations=stations)
    else:
        date = request.form.get('date', 0)
        zone = request.form.get('zone', 0)
        station = request.form.get('station', 0)
        biotope = request.form.get('biotope', 0)
        place = request.form.get('place', 0)
        cx = request.form.get('cx', 0)
        cy = request.form.get('cy', 0)
        traps = request.form.get('traps', 0)
        catched = request.form.get('catched', 0)
        comments = request.form.get('comments', 0)
        try:
            with myDbConnection().connect() as db:
                cur = db.cursor()
                cur.execute(f"insert into catch(Date, Zone_ID, Station_ID, Biotope, Place, Coords_X, Coords_Y, Traps_Amount, Catched_Amount, Comments)"
                            f"values ('{date}', '{zone}', '{station}', '{biotope}', '{place}', '{cx}', '{cy}', '{traps}', '{catched}', '{comments}');")
                db.commit()
                return "success", http.HTTPStatus(200)
        except:
            return "error", http.HTTPStatus(400)

#addMouse
@app.route('/addMouse/<int:catchID>', methods=['POST'])
def addMouse(catchID):
    catch = catchID
    type_id = request.form.get('type', 0)
    pregnancy = request.form.get('pregnancy', 0)
    gender = request.form.get('gender', 0)
    age = request.form.get('age', 0)
    embryos = request.form.get('embryos', 0)
    disease = request.form.get('diseaseID', 0)
    try:
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"INSERT INTO `mouse` (`ID_Mouse`, `Catch_ID`, `Type_ID`, `Pregnancy_ID`, `Gender`, `Age`, `Embryos_Amount`, `ID_Disease`) VALUES (NULL, '{catch}', '{type_id}', '{pregnancy}', '{gender}', '{age}', '{embryos}', '{disease}');")
            db.commit()
            return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)

@app.route('/addMice/<int:catchID>', methods = ['POST'])
def addMice(catchID):
    try:
        myList = request.get_json()
        with myDbConnection().connect() as db:
            cur = db.cursor()
            for item in myList["mice"]:
                cur.execute(f"INSERT INTO `mouse` (`ID_Mouse`, `Catch_ID`, `Type_ID`, `Pregnancy_ID`, `Gender`, `Age`, `Embryos_Amount`, `ID_Disease`) VALUES (NULL, '{catchID}', '{item["type"]}', '{item["pregnancy"]}', '{item["gender"]}', '{item["age"]}', '{item["embryos"]}', '{item["disease"]}');")
            db.commit()
        return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)

@app.route('/catchDetails/deleteCatch/<int:catchID>', methods = ['DELETE'])
def delCatch(catchID):
    try:
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"DELETE FROM `catch` WHERE `catch`.`ID_Catch` = {catchID}")
            db.commit()
            return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)


@app.route("/editMice/<int:catchID>", methods=['GET', 'PUT'])
def editMice(catchID):

    if request.method == 'GET':
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"select * from mouse where Catch_ID = {catchID}")
            mice = cur.fetchall()
            cur.execute(f"select * from types")
            types = cur.fetchall()
            cur.execute(f"select * from pregnancies")
            pregnancies = cur.fetchall()
            cur.execute(f"select * from diseases")
            diseases = cur.fetchall()
            cur.execute(f"select * from catch where ID_Catch = {catchID}")
            catch = cur.fetchone()
            return render_template('addMice.html', mice=mice, types=types,
                                   pregnancies=pregnancies, diseases=diseases, catch=catch)
    myList = request.get_data()
    myList = myList.decode("utf-8").replace("'", '"')
    myList = json.loads(myList)
    try:
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"DELETE FROM `mouse` WHERE `mouse`.`Catch_ID` = {catchID}")
            for item in myList["mice"]:
                cur.execute(f"INSERT INTO `mouse` (`ID_Mouse`, `Catch_ID`, `Type_ID`, `Pregnancy_ID`, `Gender`, `Age`, `Embryos_Amount`, `ID_Disease`) VALUES (NULL, '{catchID}', '{item["type"]}', '{item["pregnancy"]}', '{item["gender"]}', '{item["age"]}', '{item["embryos"]}', '{item["disease"]}');")
            db.commit()
            return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)

@app.route("/editCatch/<int:catchID>", methods=['GET', 'PUT'])
def editCatch(catchID):
    if request.method == 'GET':
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"select * from catch where ID_Catch = {catchID}")
            catch = cur.fetchone()
            cur.execute(f"select * from stations")
            stations = cur.fetchall()
            cur.execute(f"select * from zones")
            zones = cur.fetchall()
            return render_template("editCatch.html", catch=catch, stations=stations, zones=zones)
    date = request.form.get('date', 0)
    zone = request.form.get('zone', 0)
    station = request.form.get('station', 0)
    biotope = request.form.get('biotope', 0)
    place = request.form.get('place', 0)
    cx = request.form.get('cx', 0)
    cy = request.form.get('cy', 0)
    traps = request.form.get('traps', 0)
    catched = request.form.get('catched', 0)
    comments = request.form.get('comments', 0)
    try:
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"update catch set Date = '{date}', Zone_ID = '{zone}', Station_ID = '{station}', "
                        f"Biotope = '{biotope}', Place = '{place}', Coords_X = '{cx}', Coords_Y = '{cy}', "
                        f"Traps_Amount = '{traps}', Catched_Amount = '{catched}', Comments = '{comments}' "
                        f"where ID_Catch = {catchID};")
            db.commit()
            return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)

@app.route('/deleteMiceList/<int:catchID>', methods=['DELETE'])
def delMiceList(catchID):
    with myDbConnection().connect() as db:
        try:
            cur = db.cursor()
            cur.execute(f"delete from mouse where Catch_ID = {catchID}")
            db.commit()
            return "success", http.HTTPStatus(200)
        except:
            return "error", http.HTTPStatus(400)

#catch'и с сортировкой по дате

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8081)




# {
#     "mice":
#     [
#         {
#             "type": 1,
#             "pregnancy": 1,
#             "gender": "a",
#             "age": "ab",
#             "embryos": 15,
#             "disease": 1
#         },
#         {
#             "type": 1,
#             "pregnancy": 1,
#             "gender": "b",
#             "age": 10,
#             "embryos": 150,
#             "disease": 1
#         },
#                 {
#             "type": 1,
#             "pregnancy": 1,
#             "gender": "b",
#             "age": "aa",
#             "embryos": 1500,
#             "disease": 1
#         },
#                 {
#             "type": 1,
#             "pregnancy": 1,
#             "gender": "b",
#             "age": "aa",
#             "embryos": 1500,
#             "disease": 1
#         }
#     ]
# }