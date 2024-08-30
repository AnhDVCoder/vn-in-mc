import mysql from 'mysql'

export const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'vn-in-mc',
	port	 : 3306
  });

//General
//Delay async
export function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time)
	});
}

//set terminal name
export function setTerminalTitle(title)
{
  return process.stdout.write(
    String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
  );
}


//Update table in DB
export function updateTable(table, column_1, value_1, column_2, value_2){
	var SQL = "UPDATE " + table + " SET " + column_1 + " = " + value_1 + " WHERE " + column_2 + " = " + value_2;
    db.query(SQL, function(err) {
        if(err){
            throw err;
        };
    })
}

//Get Datetime
export function datetime(type){
    let date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });

    // Date object initialized from the above datetime string
    let date_nz = new Date(date_string);
    
    // year as (YYYY) format
    let year = date_nz.getFullYear();
    
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
    
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
    
    // hours as (HH) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
    
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
    
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
    
    // date as YYYY-MM-DD format
    if(type == 'date'){
        let date_dd_mm_yyyy = date + "-" + month + "-" + year;
        // console.log(date_dd_mm_yyyy);
        return '[' + date_dd_mm_yyyy + ']';
    }
    else if(type == 'time'){
        // time as hh:mm:ss format
        let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
        // console.log(time_hh_mm_ss);
        return '[' + time_hh_mm_ss + ']';
    }
    else if(type == 'datetime'){
        // date and time as YYYY-MM-DD hh:mm:ss format
        let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
        // console.log(date_time);
        return '[' + date_time + ']';
    }
}

//Set colors
export const CONSOLE_COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    yellow: '\x1b[33m',
};

//Print Color
export const printLog = (message, type = 'white') => {
    console.log(`${CONSOLE_COLORS[type]}%s\x1b[0m`, message); 
};