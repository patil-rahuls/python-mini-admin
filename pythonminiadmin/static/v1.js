///////////////////////////////////////////////////////////////////////
// https://stackoverflow.com/questions/5100539/django-csrf-check-failing-with-an-ajax-post-request
// Used in validate()
const getCookie = function(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie != '') {
        let cookies = document.cookie.split(';');
        // for (var i = 0; i < cookies.length; i++) {
        for (let cookie of cookies){
            cookie = cookie.trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

///////////////////////////////////////////////////////////////////////
// Validates a JSON
// Used in validate()
const IsJsonString = function(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

///////////////////////////////////////////////////////////////////////
// Immitate span[data-href] as anchor links
const links = document.querySelectorAll('span[data-href]');
for(link of links){
    link.addEventListener('click', function(e){
        window.open(e.target.getAttribute('data-href'), '_blank');
    });   
}

///////////////////////////////////////////////////////////////////////
// Show Message
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

///////////////////////////////////////////////////////////////////////
// Hide Message after a certain timeout
// Used ONLY with showMessage()
const hideMessageAfter = function(timeout){
    setTimeout(function(timeout){
        document.getElementById('message').classList.add('hide');
    }, timeout);
};

///////////////////////////////////////////////////////////////////////
// https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
// Used to copy resultTable's cell content to clipboard
const copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(function() {
        hideMessageAfter(2000);
        showMessage("Copied !");
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
    });
};

///////////////////////////////////////////////////////////////////////
// Copy resultTable's cell content to clipboard on a single click
document.querySelector('#resultTable tbody').addEventListener('click', function(row) {
    const cellText = row.target.closest('td')?.innerHTML;
    cellText && copyToClipboard(cellText);
});

///////////////////////////////////////////////////////////////////////
// Load Add/Edit connection form
// Used in home.html
const loadConnectionForm = function(action){
    if(action=='edit')
        document.getElementById('editForm').submit();
    else
        window.open(action, "_self");
};

///////////////////////////////////////////////////////////////////////
// Toggle Sidebar
const toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

///////////////////////////////////////////////////////////////////////
document.querySelector('.toggleSidebar').addEventListener('click', function() {
    toggleSidebar();
});

///////////////////////////////////////////////////////////////////////
// Toggle QueryArea
document.querySelector('.toggleQueryArea').addEventListener('click', function() {
    const queryArea = document.getElementById('queryArea').classList;
    this.textContent= queryArea.toggle('hide') ? " ▼ " : " ▲ ";
    // Hide sidebar
    document.getElementById('sidebar').classList.contains('collapsed') || toggleSidebar();
});

///////////////////////////////////////////////////////////////////////
// Hide sidebar when clicked on query editor
document.getElementById('query').addEventListener('click', function() {
    const sidebar =  document.getElementById('sidebar').classList;
    sidebar.contains('collapsed') || sidebar.toggle('collapsed');
});

///////////////////////////////////////////////////////////////////////
// Export(Download) resultTable's content into a csv
document.querySelector('.exportCSV').addEventListener('click', function() {
    const rows = document.querySelectorAll('table#resultTable tr');
    if(rows.length) {
        const csv = [];
        for(eachRow of rows) {
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

        const csvString = csv.join('\n');
        var filename = 'export_' + new Date().toLocaleDateString() + '.csv';
        const link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute('target', '_blank');
        link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString));
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click(); 
        document.body.removeChild(link); 
    }
    else{
        showMessage("No results !!", "err");
    }
});

///////////////////////////////////////////////////////////////////////
// Validate Query
// Used in validateOnSemiColon()
const validate = function(stmt) {
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

///////////////////////////////////////////////////////////////////////
// Detect a semicolon and validate the query before the semicolon.
// Also Formats the query using sqlFormatter
const validateOnSemiColon = function(stmt){
    if (stmt.slice(-1) === ';') {
        stmt = stmt.split(';')[0];
        validate(stmt);
        // Format using sql-formatter.
        document.getElementById('query').value = sqlFormatter.format(stmt, {language: 'mysql'});
    }
};

///////////////////////////////////////////////////////////////////////
// Execute a query 
const execStmt = function(stmt) {
    if(typeof stmt !== 'string' || !stmt)
        stmt = document.getElementById('query').value;
    else
        document.getElementById('query').value = stmt;
    
    // Save the pagination states before executing
    for (i of [1,2,3,4])
        localStorage.setItem('page-'+i, document.getElementById('page-'+i).value);

    showMessage("Executing Query ", "loading");

    // Replace the current tab's contents with this query
    // localStorage.setItem(`tab${lastTabID}`, stmt);
    saveTab(lastTabID);

    document.getElementById('fire').submit();
};
document.querySelector('.execStmt').addEventListener('click', execStmt);

///////////////////////////////////////////////////////////////////////
// Change query Textarea color on focus if query is ok
document.getElementById('query').addEventListener('focus', function() {
    this.style.color = queryOk ? '#00ff00' : 'orangered';     
});

///////////////////////////////////////////////////////////////////////
// Execute Query when Ctrl-Enter is pressed
document.getElementById('query').addEventListener('keydown', function(eventObj) {
    if (eventObj.ctrlKey && eventObj.keyCode == 13) {
      execStmt(this.value);
    }
});

///////////////////////////////////////////////////////////////////////
// Execute <Select * From table> from sidebar
// Used in home.html
const select_table = function(tbl) {
    document.getElementById('sidebar').classList.toggle('collapsed');
    execStmt('SELECT * FROM ' + tbl + ' LIMIT 0,50 ');
};

///////////////////////////////////////////////////////////////////////
// Appends limit selected from pagination to the query and execute
// Used in home.html
const selectRange = function (range){
    const stmtElem = document.getElementById('query');
    let stmt = stmtElem.value;
    
    // replace query with only single spaces between words
    stmt = stmt.replace(/\s\s+/g, ' ');
    
    // Removes LIMIT used at the END of query.
    const limitPresent = stmt.lastIndexOf("LIMIT");
    if (limitPresent)
        stmt = stmt.substring(0, limitPresent);
    
    stmtElem.value = stmt + ' LIMIT ' + range ;
    execStmt(stmtElem.value);
};

///////////////////////////////////////////////////////////////////////
// Handles pagination (this only scrolls horizontally)
const scroll_pag = function(direction){
    // 2 - RIGHT i.e. forward and 4 - LEFT i.e. backward
    switch(direction){
        case 2:
            for(i of [1,2,3]){
                const paginationBtn = document.getElementById('page-'+i);
                paginationBtn.value = document.getElementById('page-'+(i+1)).value;
                paginationBtn.innerText = document.getElementById('page-'+(i+1)).innerText;    
            }
            
            const lastPaginationBtn = document.getElementById('page-4');
            const limits = lastPaginationBtn.value;
            const frm = parseInt(limits.split(',')[1]) + 1;
            const to = parseInt(limits.split(',')[1]) + 50;
            lastPaginationBtn.value = frm + ',' +  to;
            lastPaginationBtn.innerText = frm + '-' + to;
        break;
        case 4:
            const firstPaginationBtn = document.getElementById('page-1');
            const lowest_limits = firstPaginationBtn.value;
            const lower_limit = parseInt(lowest_limits.split(',')[0]);
            if(lower_limit <= 1){
                // stop
                // written this intentionally for code redability.
            }
            else{
                for(i of [4,3,2]){
                    const paginationBtn = document.getElementById('page-'+i);
                    paginationBtn.value = document.getElementById('page-'+(i-1)).value;
                    paginationBtn.innerText = document.getElementById('page-'+(i-1)).innerText;    
                }

                const to = lower_limit - 1;
                let frm = to - 50 + 1 ;
                if(frm == 1)
                    frm = 0;

                firstPaginationBtn.value = frm + ',' +  to;
                firstPaginationBtn.innerText = frm + '-' + to;    
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
    pag_btn && pag_btn.classList.add('active');
};

///////////////////////////////////////////////////////////////////////
// an IIFE for detecting and registering document ready.
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

///////////////////////////////////////////////////////////////////////
// Variables for query tabs
var lastTabID = localStorage.getItem(`lastTabID`) || 1 ; // id of the last tab used
var maxTabs = 6;        // max number of tabs
const tabs = [];        // stores queries

///////////////////////////////////////////////////////////////////////
// Load query tabs and their content from localstorage
// const loadQueryTabs = function() {
//     document.querySelector("#queryTabs").innerHTML = "";
    
//     // Iterate over and recover query from all tabs saved in localstorage
//     for(let i =1; i<=maxTabs; i++) {
//         const qry = localStorage.getItem(`tab${i}`);
//         if(qry) {
//             tabs.push(qry);
//             document.querySelector("#queryTabs").innerHTML += `<button onclick="showTabContent(${i}, this);" id="tab${i}">Tab ${i}</button>`;
//             lastTabID = i; // the last index where a query was found.
//         }
//         localStorage.removeItem(`tab${i}`);
//     };

//     // Rearrange tabs in localstorage
//     for([i, tab] of tabs.entries()) {
//         console.log(`Saved tab${i+1}  => ` +  tab);
//         localStorage.setItem(`tab${i+1}`, tab);
//     }
    
//     // Show 1st tab as default one when no saved tabs are found.
//     if (!tabs.length)
//         document.querySelector("#queryTabs").innerHTML += `<button class="active" onclick="showTabContent(1, this);" id="tab1">Tab 1</button>`;
//     else {
//         // Set active tab and show active tab's content in query
//         lastTabID = localStorage.getItem(`lastTabID`) || lastTabID;
//         localStorage.setItem(`lastTabID`, lastTabID);
//         // Log current tab
//         console.log(`Current tab : Tab ${lastTabID}`);
//         document.querySelector(`#tab${lastTabID}`).classList.add("active");
//         document.getElementById("query").value = tabs[lastTabID-1];
//     }

//     // Add the "add new tab" button
//     document.querySelector("#queryTabs").innerHTML += `<button id="addQueryTab"> + </button>`;
// };

///////////////////////////////////////////////////////////////////////
// Save current tab content in localstorage BEFORE switching a tab 
// OR BEFORE adding a new tab OR on clicking a tab
const saveTab = function(tabID) {
    localStorage.setItem(`tab${tabID}`, document.getElementById("query").value);
};

///////////////////////////////////////////////////////////////////////
// Show a tab content on click and save other tab's query to localstorage
const showTabContent = function(this_tab) {
    // Save last used tab
    saveTab(lastTabID);
    
    // Remove active class from all childs
    // document.querySelector("#queryTabs").childNodes.forEach(function(val){val.classList = [];});
    for (let i=1; i<=maxTabs; i++) {
        document.querySelector(`button[id='tab${i}']`).classList.remove("active");
    }
    
    // Make current Tab Active
    this_tab.classList.add("active");
    
    // Show query from selected tab on queryEditor
    document.getElementById("query").value = localStorage.getItem(`${this_tab.id}`);
    
    // set last used tab id as current's
    lastTabID = this_tab.id.slice(-1);
    localStorage.setItem(`lastTabID` , lastTabID);
};

///////////////////////////////////////////////////////////////////////
// Adds a new tab
// const addTab = function() {
//     if(document.getElementById("query").value) {
//         // Remove Last child + 
//         document.querySelector("#queryTabs").lastElementChild.remove();
//         // Remove active class from all childs
//         document.querySelector("#queryTabs").childNodes.forEach(function(val){val.classList = [];});
//         // Add a new tab btn
//         lastTabID = document.querySelector("#queryTabs").childNodes.length;
//         document.querySelector("#queryTabs").innerHTML += `<button class="active" onclick="showTabContent(${++lastTabID},this);" id="tab${lastTabID}">Tab ${lastTabID}</button>`;
//         // Add back the Last child + 
//         document.querySelector("#queryTabs").innerHTML += `<button id="addQueryTab"> + </button>`;
//         // Clear the queryEditor.
//         document.getElementById("query").value = "";
//     }
// };

///////////////////////////////////////////////////////////////////////
// call docReady
docReady(function() {
    const stmtTxtArea = document.getElementById('query');
    
    ///////////////////////////////////////////////////////////////////////
    // Get the limits if set
    let stmt = stmtTxtArea.value.trim();
    if(queryOk && stmt.toUpperCase().includes("LIMIT")) {
        const limits = stmtTxtArea.value.split('LIMIT')[1].trim();
        localStorage.setItem('limits', limits);
        
        // Fetch pagination details from localstorage and set
        for(i of [1,2,3,4]) {
            const paginationBtn = document.getElementById('page-'+i);
            paginationBtn.value = localStorage.getItem('page-'+i);
            paginationBtn.innerText = localStorage.getItem('page-'+i).replace(',','-');
            // Remove active class from all of 'em
            paginationBtn.classList.remove('active');
        }
        
        // Set the active limit
        var pag_btn = document.querySelectorAll("button[value='" + limits + "']")[0];
        pag_btn && pag_btn.classList.add('active');
    }

    // loadQueryTabs();
    stmtTxtArea.value = localStorage.getItem(`tab${lastTabID}`);
    
    // Set last used tab active
    document.querySelector(`button[id='tab${lastTabID}']`).classList.add("active");
    
    ///////////////////////////////////////////////////////////////////////
    // Save tabs state to localstorage when adding a new tab
    // document.addEventListener("click", function(e) {
    //     if(e.target && e.target.id == "addQueryTab") {
    //         if(lastTabID < maxTabs) {
    //             saveTab(lastTabID);
    //             addTab();
    //         }
    //         else{
    //             showMessage(`Maximum ${maxTabs} Tabs Allowed. (You can set variable 'maxTabs' for as many tabs as you want.)`, "err");
    //             hideMessageAfter(3000);
    //         }
    //     }
    // });
});

///////////////////////////////////////////////////////////////////////
// ADD/EDIT CONNECTION FORM
document.getElementById('save').addEventListener('click', function() {
    const saveForm = document.getElementById("add");

    for(const input of saveForm.elements){
        input.value = input.value.trim();
        if(!input.value)
            return;
    }

    document.querySelector('.loading').classList.remove('hide');
    for( input of saveForm.elements)
        input.readOnly = true;
    saveForm.submit();
});

// To DO :
// btn for sync tables in sidebar
// make a ajax common fn with async true / false param. use validate() before exec()