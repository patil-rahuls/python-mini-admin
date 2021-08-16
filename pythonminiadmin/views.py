from django.shortcuts import render
from pythonminiadmin.models import connections
import mysql.connector as DB
from mysql.connector import Error
from time import time
from pythonminiadmin.forms import Add
from pythonminiadmin.constants import constants
from django.http import JsonResponse
from django.shortcuts import redirect

# Data Query Commands
queryCommands = ['select', 'show']

def home(request):
    # Get all saved connections from app's model
    allConns = connections.objects.all()
    
    # POSTed data
    _id =  int(request.POST.get("conn", 0))
    _query = request.POST.get("query", "")

    # VIEW DEFAULT DATA
    hideMainElements=''
    hideEdit = ''
    queryResultRows=()
    queryResultFields=()
    resultAreaState=''
    queryAreaState=''
    tables=()
    message = ''
    messageState="hide"
    status = "Not connected"
    statusState = "err"
    serverInfo = ''
    dbName = ''
    queryTime = 0
    fetchTime = 0
    slowQuery = ""
    
    if _id and len(allConns):
        # Connect to POSTed connection id else connect to default connection.
        curr_conn = allConns.get(id=_id)
        fetch_tic = time()
        
        try:
            # Connect to the selected MySQL Server connection
            connection = DB.connect(
                host=curr_conn.host,
                database = curr_conn.dbname,
                user=curr_conn.dbusr,
                passwd=curr_conn.dbpass
            )
            if connection.is_connected():
                #Set View's Data
                dbName = curr_conn.dbname
                serverInfo = connection.get_server_info() # Get MySQL version
                status = "Connected"
                statusState="ok"

                # Fetch Table Names:
                cursor = connection.cursor()
                tableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = '"+dbName+"' "
                cursor.execute(tableQuery)
                tables = [table[0] for table in cursor.fetchall()]
                cursor.close()

                # Start Querying...
                if _query != "" and _query != ";":
                    _query = _query.strip()
                    
                    # create a cursor to query the database.
                    cursor = connection.cursor()
                    cursor.execute("USE " + dbName + ";")
                    cursor.close()
                    
                    if any(commands in _query.lower() for commands in queryCommands):
                        # Remove Semicolon and add default LIMIT
                        if 'limit' not in _query.lower() and 'select' in _query.lower():
                            if _query[-1] == ';':
                                _query = _query[:-1]
                            _query = _query + " LIMIT 0,50"
                        # start counting time taken
                        tic = time()
                        cursor = connection.cursor()
                        cursor.execute(_query)                    
                        # Calculate time taken (seconds) to query
                        queryTime = round(time() - tic, 4)
                        # Get Result Rows
                        queryResultRows = cursor.fetchall()
                        if not queryResultRows:
                            message = "No results found !!"
                            messageState = "err"
                        else:
                            message = "Query executed successfully!"
                            messageState = "ok"
                        # Get Table fields
                        queryResultFields = [i for i in cursor.column_names]
                        cursor.close()
                    
                    else: # Create Update Delete and all DMLs
                        cursor = connection.cursor()
                        connection.commit()
                        if cursor.rowcount > 0:
                            message = "Statement executed successfully! No. of rows affected : " + str(cursor.rowcount)
                            messageState = "ok"
                        else:
                            message = "Statement execution failed! Please check your Statement."
                            messageState = "err"
                        cursor.close()
                    
                    connection.close()
                else:
                    message = "Connected successfully! Start Querying !"
                    messageState = "ok"
            else:
                message = "Please check MySQL Connection credentials and try again!"
                messageState = "err"

        except Error as e:
            message = str(e)
            messageState = "err"

        # Calculate time taken (seconds) to fetch result  
        fetchTime = str(round((time() - fetch_tic), 4))        
        #Flag used to indicate slow query on UI
        if queryTime > 4 :
            slowQuery = "err"
            message = 'Query is Slow. Try using EXPLAIN on the query. Check for temporary or filesort.'
            messageState = "err"
        queryTime = str(queryTime)
    
    else:
        message = 'Please select or create a MySQL connection.'
        messageState = "err"
    
    if not _id:
        hideEdit = 'hide'

    if not _id or "err" in statusState:
        hideMainElements = "hide"
    
    if not _id or "err" in statusState or len(queryResultFields):
        queryAreaState = "hide"

    if not _query or not len(queryResultFields):
        resultAreaState = "hide"

    # Prepare Data to be sent to the View
    context = {
        # Constants
        'title': constants.title,
        'version': constants.version,
        
        # Connection related
        'allConns': allConns,
        'conn': _id,
        'query':_query,
        'queryResultRows': queryResultRows,
        'queryResultFields': queryResultFields,

        # Error/Success class name for some header items 
        'hideMainElements':hideMainElements,
        'hideEdit':hideEdit,
        'resultAreaState':resultAreaState,
        'queryAreaState':queryAreaState,
        
        # Tables' list shown in sidebar
        'tables':tables,

        # messages
        'message':message,
        'messageState':messageState,

        # Footer Items
        'status':status,
        'statusState':statusState,
        'serverInfo' : serverInfo,
        'dbName' : dbName,
        'queryTime':queryTime,
        'fetchTime':fetchTime,
        'slowQuery': slowQuery,
    }
    return render(request, 'home.html',  context=context)

def add(request):
    # POSTed data OR Default ""
    _host = request.POST.get("host", "")
    _dbname = request.POST.get("dbname", "")
    _dbusr = request.POST.get("dbusr", "")
    _dbpass = request.POST.get("dbpass", "")
    _connname = request.POST.get("connname", "")
    
    result = "err"
    message=""
    
    if request.method == "POST":
        if _host and _dbname and _dbusr and _dbpass and _connname:
            new_conn = connections(host=_host, port="3306", dbname=_dbname, dbusr=_dbusr, dbpass=_dbpass, identifier=_connname)
            new_conn.save()
            result = "ok"
            message = "Connection Saved Successfully"
        else:
            message = "Failed. Some info missing."
    
    # Create and Initialize connection Form
    form = Add(initial=
        {
            'host': _host,
            'dbname' : _dbname,
            'dbusr' : _dbusr,
            'dbpass' : _dbpass,
            'connname' : _connname,
        }
    ) 
    # Prepare Data to be sent to the View
    context = {
        # Constants
        'title': constants.title,
        'version': constants.version,

        'form': form,
        'result': result,
        'message': message,
    }
    return render(request, 'add.html',  context=context)

def edit(request):
    # Get all saved connections from app's model
    allConns = connections.objects.all()
    
    _id =  int(request.POST.get("id", 0))
    if not check(allConns, _id) or request.method != "POST" or not _id:
        return redirect(add, permanent=...)
    
    result = "err"
    _host, _dbname, _dbusr, _dbpass, _connname, connNametoDisplay, message = ('',)*7

    edit_conn = allConns.get(id=_id)
    _edited = int(request.POST.get("edited", 0))
    _host = request.POST.get("host", edit_conn.host)
    _dbname = request.POST.get("dbname", edit_conn.dbname)
    _dbusr = request.POST.get("dbusr", edit_conn.dbusr)
    _dbpass = request.POST.get("dbpass", edit_conn.dbpass)
    _connname = request.POST.get("connname", edit_conn.identifier)
    connNametoDisplay = edit_conn.identifier
       
    if _edited:
        if _id and _host and  _dbname and _dbusr and _dbpass and _connname:
            edit_conn = allConns.get(id=_id)
            edit_conn.host=_host
            edit_conn.save()
            edit_conn.port="3306"
            edit_conn.save()
            edit_conn.dbname=_dbname
            edit_conn.save()
            edit_conn.dbusr=_dbusr
            edit_conn.save()
            edit_conn.dbpass=_dbpass
            edit_conn.save()
            edit_conn.identifier=_connname
            edit_conn.save()
            result = "ok"
            message = "Connection Updated Successfully"
        else:
            message = "Failed. Some info missing."

    # Create and Initialize connection Form
    form = Add(initial=
        {
            'host':_host, 
            'dbname' :_dbname,
            'dbusr' :_dbusr,
            'dbpass' :_dbpass,
            'connname' :_connname,
        }
    )
    # Prepare Data to be sent to the View
    context = {
        # Constants
        'title': constants.title,
        'version': constants.version,
        
        'form': form,
        'result': result,
        'message':message,
        'id' : _id,
        'connname' : connNametoDisplay,
    }
    return render(request, 'edit.html', context=context)

def validateQuery(request):
    # Get all saved connections from app's model
    allConns = connections.objects.all()
    validationResult = ''

    # POSTed data 
    query = request.POST.get('test', None)
    _id = request.POST.get('conn_id', None)
    
    if check(allConns, _id) and request.method == "POST" and _id and query :
        try:
            curr_conn = allConns.get(id=_id)
            connection = DB.connect(host=curr_conn.host,database = curr_conn.dbname,user=curr_conn.dbusr,passwd=curr_conn.dbpass)
            if connection.is_connected():
                cursor = connection.cursor()            
                allowed_stmts = ['SELECT' , 'INSERT' , 'DELETE' , 'REPLACE' , 'UPDATE' ]
                query = query.strip()
                # Here add more validatin like length and minimum words before hitting cursor.execute()
                if query.split()[0].upper() in allowed_stmts:
                    cursor.execute('EXPLAIN ' + query)
                    explainResultFields = [i for i in cursor.column_names]
                    explainResultRow = cursor.fetchall()[0]
                    validationResult = [ explainResultFields , explainResultRow ]
            else:
                validationResult = 'Error: Real time validation failed because MySQL connection timed out. Please try again !!'   

            if connection.is_connected():
                cursor.close()
                connection.close()
        
        # cursor.execute() fails if query is invalid and the error is captured as an exception here.
        except Error as e:
            validationResult = "Error: " + str(e).split(':')[1]

    else:
        validationResult = 'Error: Please check your MySQL connection. If not found, please add a MySQL connection first !!'

    # Below 'safe=False' is required because this is called from an Ajax Request 
    # and its main job is to eliminate CSRF token validation during request. 
    return JsonResponse(validationResult, safe=False)

def check(allConns, conn_id):
    # Get all saved connections from app's model
    allConns = connections.objects.all()
    try:
        if allConns.get(id=conn_id):
            return True
    except:
        return False
    return False

# ToDO - Syncs table names to show in sidebar
# def syncTables(request):
#     _id = request.POST.get('conn', 4)
#     curr_conn = allConns.get(id=_id)
#     tables = ()
#     message='true'    
#     try:
#         connection = DB.connect(
#             host=curr_conn.host,
#             database = curr_conn.dbname,
#             user=curr_conn.dbusr,
#             passwd=curr_conn.dbpass
#         )
#         if connection.is_connected():
#             cursor = connection.cursor()
#             cursor.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = ' + curr_conn.dbname)
#             queryResultRows = cursor.fetchall()
#         else:
#             message = 'Real time validation failed because MySQL connection timed out. Retrying...'
            
#         # Close the cursor and connection object after querying
#         if (connection.is_connected()):
#            cursor.close()
#            connection.close()

#     except Error as e:
#         message = str(e).split(':')[1]
    
#     return JsonResponse({'message':message, 'data':queryResultRows}, safe=False)
