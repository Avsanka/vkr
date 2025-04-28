import http
import io
import json
import pandas as pd
from datetime import datetime
from flask import Flask, render_template, request, send_file, redirect, url_for
from flask_login import LoginManager, login_user, login_required, logout_user
from models import myDbConnection, UserLogin
from werkzeug.security import check_password_hash

app = Flask(__name__)
login_manager = LoginManager(app)
app.secret_key = "super secret key"  # я знаю что так нельзя делать но я сделал

@app.errorhandler(401)
def unauthorized(error):
    return redirect(url_for('login'))

@login_manager.user_loader
def load_user(user_id):
    return UserLogin().fromDB(user_id)


@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        with myDbConnection().connect() as db:
            cur = db.cursor()
            log = request.form.get('login', 0)
            cur.execute(f"select * from users where login = '{log}' limit 1")
            user = cur.fetchone()
            if user and check_password_hash(user['hashPassword'], request.form.get('password')):
                userlogin = UserLogin().create(user)
                login_user(userlogin, remember=False)
                return "success"
    if request.method == 'GET':
        return render_template("login.html")
    return "wrong login"


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/catches', methods=['GET'])
@login_required
def allCatches():
        if request.method == 'GET':
            with myDbConnection().connect() as db:
                cur = db.cursor()
                cur.execute(f"select * from districts")
                districts = cur.fetchall()
                cur.execute(f"select * from stations")
                stations = cur.fetchall()
                cur.execute(f"select * from zones")
                zones = cur.fetchall()
            return render_template("index.html", now=datetime.now(), districts=districts, zones=zones,
                                   stations=stations)


@app.route('/health', methods=['GET'])
def healthCheck():
    return "success", http.HTTPStatus(200)


@app.route('/sortCatches', methods=['POST'])
@login_required
def filteredCatches():
    data = request.get_json()
    headers = data[0]
    filters = data[1]
    new_headers = []
    new_filters = []

    for i in range(len(filters)):
        if filters[i] != '0':
            new_headers.append(headers[i])
            new_filters.append(filters[i])
    data = [new_headers, new_filters]

    query = "select * from catch where"
    for i in range(len(data[0])):
        query += f" {data[0][i]} = {data[1][i]} and"
    query = query[:-4]
    default = [{'empty': 0}]
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute(query)
        catches = cur.fetchall()
        if len(catches) == 0:
            return default, http.HTTPStatus(200)
        else:
            return catches, http.HTTPStatus(200)


@app.route('/catchDetails/<int:catchID>', methods=['GET'])
@login_required
def catchDetails(catchID):
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute(f"SELECT ID_Catch, Date, zones.Name as Zone, stations.Name as Station, districts.Name as District, "
                    f"Biotope, Place, Coords_X, Coords_Y, Traps_Amount, Catched_Amount, Comments"
                    f" FROM `catch` left join zones on catch.Zone_ID = zones.ID_Zone "
                    f"left join stations on catch.Station_ID = stations.ID_Station "
                    f"left join districts on catch.District_ID = districts.ID_District "
                    f"WHERE ID_Catch = {catchID}")
        catch = cur.fetchone()
        return render_template('catchDetails.html', catch=catch)


@app.route('/mice/<int:catchID>', methods=['GET'])
@login_required
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
@login_required
def addCatch():
    if request.method == 'GET':
        with myDbConnection().connect() as db:
            cur = db.cursor()
            cur.execute(f"select * from stations")
            stations = cur.fetchall()
            cur.execute(f"select * from zones")
            zones = cur.fetchall()
            cur.execute(f"select * from districts")
            districts = cur.fetchall()
            return render_template("addCatch.html", zones=zones, stations=stations, districts=districts)
    else:
        date = request.form.get('date', 0)
        zone = request.form.get('zone', 0)
        station = request.form.get('station', 0)
        biotope = request.form.get('biotope', 0)
        district = request.form.get('district', 0)
        place = request.form.get('place', 0)
        cx = request.form.get('cx', 0)
        cy = request.form.get('cy', 0)
        traps = request.form.get('traps', 0)
        catched = request.form.get('catched', 0)
        comments = request.form.get('comments', 0)
        try:
            with myDbConnection().connect() as db:
                cur = db.cursor()
                cur.execute(f"insert into catch(Date, Zone_ID, Station_ID, Biotope, District_ID, Place, Coords_X, Coords_Y, Traps_Amount, Catched_Amount, Comments)"
                            f"values ('{date}', '{zone}', '{station}', '{biotope}', '{district}', '{place}', '{cx}', '{cy}', '{traps}', '{catched}', '{comments}');")
                db.commit()
                return "success", http.HTTPStatus(200)
        except:
            return "error", http.HTTPStatus(400)


@app.route('/addMouse/<int:catchID>', methods=['POST'])
@login_required
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
@login_required
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
@login_required
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
@login_required
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
                cur.execute(f"INSERT INTO `mouse` (`ID_Mouse`, `Catch_ID`, `Type_ID`, `Pregnancy_ID`, `Gender`, `Age`, "
                            f"`Embryos_Amount`, `ID_Disease`) VALUES (NULL, '{catchID}', '{item["type"]}', "
                            f"'{item["pregnancy"]}', '{item["gender"]}', '{item["age"]}', '{item["embryos"]}', "
                            f"'{item["disease"]}');")
            db.commit()
            return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)


@app.route("/editCatch/<int:catchID>", methods=['GET', 'PUT'])
@login_required
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
            cur.execute(f"select * from districts")
            districts = cur.fetchall()
            return render_template("editCatch.html", catch=catch, stations=stations, zones=zones, districts=districts)
    date = request.form.get('date', 0)
    zone = request.form.get('zone', 0)
    station = request.form.get('station', 0)
    biotope = request.form.get('biotope', 0)
    district = request.form.get('district', 0)
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
                        f"Biotope = '{biotope}', District_ID = '{district}', Place = '{place}', Coords_X = '{cx}', "
                        f"Coords_Y = '{cy}', "
                        f"Traps_Amount = '{traps}', Catched_Amount = '{catched}', Comments = '{comments}' "
                        f"where ID_Catch = {catchID};")
            db.commit()
            return "success", http.HTTPStatus(200)
    except:
        return "error", http.HTTPStatus(400)


@app.route('/deleteMiceList/<int:catchID>', methods=['DELETE'])
@login_required
def delMiceList(catchID):
    with myDbConnection().connect() as db:
        try:
            cur = db.cursor()
            cur.execute(f"delete from mouse where Catch_ID = {catchID}")
            db.commit()
            return "success", http.HTTPStatus(200)
        except:
            return "error", http.HTTPStatus(400)


@app.route('/downloadExcel/<int:catchID>', methods=['POST'])
@login_required
def downloadExcel(catchID):
    data = request.get_json()
    df = pd.DataFrame(data[0:-2], columns=data[-2])
    add_data_df = pd.DataFrame([data[-1]], columns=['Дата отлова: ', 'Район: ', 'Место: '])
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        add_data_df.to_excel(writer, index=False, sheet_name='Data', startrow=0)
        df.to_excel(writer, index=False, sheet_name='Data', startrow=2)
        for column in df:
            column_width = max(df[column].astype(str).map(len).max(), len(column)) + 3
            col_idx = df.columns.get_loc(column)
            writer.sheets['Data'].set_column(col_idx, col_idx, column_width)
        writer.sheets['Data'].set_column(0, 3, 20)

    output.seek(0)
    return send_file(output, download_name=f"data.xlsx", as_attachment=True), http.HTTPStatus(200)

@app.route('/dashboard', methods=['GET'])
@login_required
def showDashboard():
    return render_template('dashboard.html')


@app.route('/getDiseases/<int:year>', methods=['GET'])
@login_required
def getDiseases(year):
    with myDbConnection().connect() as db:
        cur = db.cursor()
        cur.execute(f"SELECT diseases.Name as disease, count(diseases.Name) as disease_amount "
                    f"from mouse "
                    f"left join diseases ON mouse.ID_Disease = diseases.Disease_ID "
                    f"left join catch ON mouse.Catch_ID = catch.ID_Catch "
                    f"where YEAR(catch.Date) = {year} GROUP BY diseases.Name")
        diseases = cur.fetchall()
        if diseases:
            return diseases, http.HTTPStatus(200)
        return [{'disease': 'Нет информации', 'disease_amount': 1}]


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8081)
