// Immitate span[data-href] as anchor links
const links = document.querySelectorAll('span[data-href]');
for( link of links){
    link.addEventListener('click', function(e){
        var ele = e.target;
        window.open(ele.getAttribute('data-href'), '_blank');
    });   
}

// Show message in messageArea
    const showMessage = function(msg , typeClass="ok"){
        const messageBox = document.getElementById('message');
        messageBox.classList=[];    
        messageBox.classList.add('msg');
        messageBox.classList.add(typeClass);
        
        // Three animated dots in Loading...
        if(typeClass === 'loading'){
            for(i of [0,0,0])
                msg += "<span class='loader__dot'>.</span>";
        }

        messageBox.innerHTML = msg;
    };
    const hideMessageAfter = function(timeout){
        setTimeout(function(timeout){
            document.getElementById('message').classList.add('hide');
        }, timeout);
    };

// Copy text to clipboard
    const copyToClipboard = function(text) {
        // obj.focus();
        // obj.select();
        // try {
        //     document.execCommand('copy');
        //     showMessage("Copied !");
        // } catch (err) {
        //     console.warn('Couldn`t copy cell value to clipboard.');
        // }
        // obj.blur();
        
        // From https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
        navigator.clipboard.writeText(text).then(function() {
            hideMessageAfter(2000);
            showMessage("Copied !");
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    };

// Load Add/Edit connection form
    const loadConnectionForm = function(action){
        if(action=='edit')
            document.getElementById('editForm').submit();
        else
            window.open(action, "_self");

        // To do next feature - ajax
        // const connectionFormAppearance = document.getElementById('connection').classList;
        // const contentAppearance = document.getElementById('content').classList;
        
        // // Show form and blur bg
        // if(!connectionFormAppearance.toggle('hide')){
        //     contentAppearance.add('blur');
            
        //     // send ajax req to fetch form Data.
        //     if(action=='add'){
        //         // Add
                
        //     }else{
        //         // Edit
        //     }
        // }
        // else
        //     contentAppearance.remove('blur');
    };

// Toggle Sidebar
const toggleSidebar = function(){
    document.getElementById('sidebar').classList.toggle('collapsed');
}
document.querySelector('.toggleSidebar').addEventListener('click', function(){
    toggleSidebar();
});

// Toggle QueryArea View
document.querySelector('.toggleQueryArea').addEventListener('click', function(){
    const queryArea = document.getElementById('queryArea');
    this.textContent= queryArea.classList.toggle('hide') ? " ▼ " : " ▲ ";
    // Hide sidebar
    document.getElementById('sidebar').classList.contains('collapsed') || toggleSidebar();
});

// Quick and simple export resultTable into a csv
document.querySelector('.exportCSV').addEventListener('click', function() {
    const rows = document.querySelectorAll('table#resultTable tr');
    if(rows.length){
        const csv = [];
        for(eachRow of rows){
            const csvRow = [];
            const colsOfEachRow = eachRow.querySelectorAll('td, th');
            for(eachColOfEachRow of colsOfEachRow) {
                // remove multiple spaces and jumpline replace with ' '
                let cell = eachColOfEachRow.innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
                // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
                cell = cell.replace(/"/g, '""');
                // Push escaped string
                csvRow.push('"' + cell + '"');
            }
            csv.push(csvRow.join(';'));
        }

        // Download it using custom headers
        const csvString = csv.join('\n');
        var filename = 'export_' + new Date().toLocaleDateString() + '.csv';        
        const link = document.createElement('a'); // Create a imaginary anchor tag to simulate csv download in background
        link.style.display = 'none';
        link.setAttribute('target', '_blank');
        link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString));
        link.setAttribute('download', filename);        
        document.body.appendChild(link); // emulate that anchor link click 
        link.click(); // once done, remove that link.
        document.body.removeChild(link); // and chill
    }
    else{
        showMessage("No results !!", "err");
    }
});

// Copy resultTable's cell content to clipboard on single click
document.querySelector('#resultTable tbody').addEventListener('click', function(row){
    const cellText = row.target.closest('td')?.innerHTML;
    // console.log(cell.innerHTML, row.rowIndex, cell.cellIndex);
    // console.log(cellText);
    cellText && copyToClipboard(cellText);
});

// Change Textarea color on focused is query is ok
document.getElementById('query').addEventListener('focus', function(){
    if(!queryOk)
        this.style.color = 'orangered';
    else
        this.style.color = '#fff';     
});

// Validate Query
    const validate = function(stmt){
        showMessage("Checking Query ", "loading");
        
        var conn_id = document.getElementById('conn').value;
        var params = 'test=' + stmt + '&conn_id=' + conn_id;
        
        var http = new XMLHttpRequest();
        http.open('POST', queryCheckerURL, true); // 3rd argument is sync / async 
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        http.onreadystatechange = function() {
            if (http.readyState == XMLHttpRequest.DONE){
                if(IsJsonString(http.responseText)){
                    explainTable = JSON.parse(http.responseText);
                    if (typeof explainTable == "object"){
                        document.getElementById('query').style.color = '#fff !important';
                        showMessage("Query looks valid!! No errors found!! Check Browser's CONSOLE to view the result of EXPLAIN.");
                        console.table(explainTable);
                    }
                    else{ //if(!explainTable || explainTable.includes("Error:")){
                        document.getElementById('query').style.color = 'orangered !important';
                        showMessage(explainTable || "Please correct your query!", "err");            
                    }
                }
                else
                    showMessage("SOmething went wrong. This will be fixed in the next commit.", "err");
                
                hideMessageAfter(4000);
            }
        }
        http.send(params);
    };
    const validateOnSemiColon = function(stmt){
        // Remove last semicolon
        if (stmt.slice(-1) === ';'){
            // Validate the line containing query
            stmt = stmt.split(';')[0];
            // This will avoid multiple semicolons at the end of query
            // document.getElementById('query').value = stmt.replace(/(\r\n|\n|\r)/gm, "");
            document.getElementById('query').value = stmt;
            validate(stmt);
        }
        else{
            const queryTabs = document.querySelector('.queryTabs').classList;
            if(queryTabs.contains('hide')) {
                queryTabs.toggle('hide');
                setTimeout(() => {
                    document.querySelector('.queryTabs').classList.toggle('hide');
                }, 3000);
            }
        }
    };

// Fire Query 
    const execStmt = function(stmt){
        if(typeof stmt !== 'string' || !stmt)
            stmt = document.getElementById('query').value;
        else
            document.getElementById('query').value = stmt;
        
        // Save the pagination states before executing
        for(i of [1,2,3,4])
            localStorage.setItem('page-'+i, document.getElementById('page-'+i).value);    

        // validate(stmt);
        showMessage("Executing Query ", "loading");
        document.getElementById('fire').submit();    
    };
document.querySelector('.execStmt').addEventListener('click', execStmt);
document.getElementById('query').addEventListener('keydown', function(eventObj) {
    if (eventObj.ctrlKey && eventObj.keyCode == 13) {
      // Ctrl-Enter pressed
      execStmt(this.value);
    }
});

// Show Table from Sidebar.
    const select_table = function(tbl){
        document.getElementById('sidebar').classList.toggle('collapsed');
        execStmt('SELECT * FROM ' + tbl + ' LIMIT 0,50;');
    };

// Breadcrumb functions
    // Appends limit selected from pagination to the query and execute
    const selectRange = function (range){
        const stmtElem = document.getElementById('query');
        let stmt = stmtElem.value;
        
        // replace query with only single spaces between words
        stmt = stmt.replace(/\s\s+/g, ' ');
        
        // Removes LIMIT used at the END of query. Ignores LIMIT used in the middle of the query.
        const limitPresent = stmt.lastIndexOf("LIMIT");
        if (limitPresent !== -1 || limitPresent !== -1)
            stmt = stmt.substring(0, limitPresent);
        
        stmtElem.value = stmt + ' LIMIT ' + range;
        execStmt();
    };
    // Handles pagination
    function scroll_pag(direction){
        // 2 - RIGHT i.e. forward and 4 - LEFT i.e. backward
        switch(direction){
            case 2:
                for(i of [1,2,3]){
                    document.getElementById('page-'+i).value = document.getElementById('page-'+(i+1)).value;
                    document.getElementById('page-'+i).innerText = document.getElementById('page-'+(i+1)).innerText;    
                }
                
                const limits = document.getElementById('page-4').value;
                const frm = parseInt(limits.split(',')[1]) + 1;
                const to = parseInt(limits.split(',')[1]) + 50;

                document.getElementById('page-4').value = frm + ',' +  to;
                document.getElementById('page-4').innerText = frm + '-' + to;
            break;
            case 4:

                const lowest_limits = document.getElementById('page-1').value;
                const lower_limit = parseInt(lowest_limits.split(',')[0]);
                if(lower_limit <= 1){
                    // stop
                    // written this intentionally for code redability.
                }
                else{
                    for(i of [4,3,2]){
                        document.getElementById('page-'+i).value = document.getElementById('page-'+(i-1)).value;
                        document.getElementById('page-'+i).innerText = document.getElementById('page-'+(i-1)).innerText;    
                    }

                    const to = lower_limit - 1;
                    let frm = to - 50 + 1 ;
                    if(frm == 1)
                        frm = 0;

                    document.getElementById('page-1').value = frm + ',' +  to;
                    document.getElementById('page-1').innerText = frm + '-' + to;    
                }                
            break;
            default:break;
        }

        // Remove active class from all of 'em
        for (i of [1,2,3,4])
            document.getElementById('page-'+i).classList.remove('active');
        
        // set the reqd. btn active by getting limit from localstorage.
        var lmts = localStorage.getItem('limits');
        var pag_btn = document.querySelectorAll("button[value='" + lmts + "']")[0];
        if(pag_btn)
            pag_btn.classList.add('active');
        // selectRange(lmts);
    };
        
    
// an IIFE for detecting document ready.
(function(funcName, baseObj) {
    // The public function name defaults to window.docReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the docReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if ( document.readyState === "complete" ) {
            ready();
        }
    }

    // This is the one public interface
    // docReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function(callback, context) {
        if (typeof callback !== "function") {
            throw new TypeError("callback for docReady(fn) must be a function");
        }
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({fn: callback, ctx: context});
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === "complete") {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener("DOMContentLoaded", ready, false);
                // backup is window load event
                window.addEventListener("load", ready, false);
            } else {
                // must be IE
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("docReady", window);
        
// A function that selects the correct breadcrumb on page load.
    const setActiveLimits = function(limits){
        // Fetch pagination details from localstorage and set
        for(i of [1,2,3,4]){
            document.getElementById('page-'+i).value = localStorage.getItem('page-'+i);
            document.getElementById('page-'+i).innerText = localStorage.getItem('page-'+i).replace(',','-');
            // Remove active class from all of 'em
            document.getElementById('page-'+i).classList.remove('active');
        }
        // set the  active limit
        const pag_btn = document.querySelectorAll("button[value='" + limits + "']")[0];
        if(pag_btn)
            pag_btn.classList.add('active');
    };

// Usage
docReady(function() {

    const stmtTxtArea = document.getElementById('query');

    // If query ran successfully then hide QueryArea to view table.
    // const toggleQueryArea = document.querySelector('.toggleQueryArea');
    // if(queryOk){
    //     toggleQueryArea.textContent = document.getElementById('queryArea').classList.toggle('hide') ? " ▼ " : " ▲ ";
    // }else{
    //     toggleQueryArea.textContent =" ▲ ";
    //     stmtTxtArea.style.color = 'orangered';
    // }

    // Get the limits if set
    let stmt = stmtTxtArea.value.trim();    
    if(queryOk && stmt.toUpperCase().includes("LIMIT")){
        const limits = stmtTxtArea.value.split('LIMIT')[1].trim();
        localStorage.setItem('limits', limits);
        setActiveLimits(limits);
    }
});

// Sync tables in sidebar
// document.querySelector('.syncTables').addEventListener('click', syncTables);


// AJAX for syncing Tables
// const syncTables = function(stmt){
//     showMessage("Syncing Tables ", "loading");
    
//     var conn_id = document.getElementById('conn').value;
//     var params = 'conn=' + conn_id + '&token=awesome&;
    
//     var http = new XMLHttpRequest();
//     http.open('POST', syncTablesURL, true);
//     http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
//     http.onreadystatechange = function() {
//         if (http.readyState == XMLHttpRequest.DONE){
//             if (http.responseText == "\"1\"")
//                 showMessage("Query looks valid!! No errors found!!");
//             else if(http.responseText != "")
//                 showMessage(http.responseText, "err");            
//             hideMessageAfter(4000);
//         }
//     }
//     http.send(params);
// }


// https://stackoverflow.com/questions/5100539/django-csrf-check-failing-with-an-ajax-post-request
// Used in validate()
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// window.console = {
//     table: function(str){
//         var node = document.createElement("div");
//         node.appendChild(document.createTextNode(str));
//         document.getElementById("query").appendChild(node);
//     }
// }
  

// To DO :
// shw explain data somwhere.
// copy to Clipboard on clicking a cell in results table
// tabs based query. store in localStorage