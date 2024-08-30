import { datetime, db, printLog } from './function.js';
import cliProgress from 'cli-progress'

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const session = process.argv[2];

db.connect(function(err) {
    if (err) throw err;
    printLog(datetime('time') + '[INFO]: Kết nối thành công tới CSDL!', 'green');
});

var SQL  = 'SELECT id FROM session_task WHERE session = ' + session + ' AND complete = 0 ORDER BY id DESC';
db.query(SQL, function (error, results) {
    if (error){
        throw error;
    }
    var count = 0;
    bar1.start(results.length, 0);
    results.forEach(row => {
        var SQL = 'INSERT INTO process_scan (session, id_ST, task) VALUES (' + session + ', ' + row.id + ', ?)';
        
        for(var i = 1; i <= 4; i++){
            db.query(SQL, i, function (error) {
                if (error){
                    throw error;
                }
                count+= 0.25;
                bar1.update(count);
            });
        }
    });
    bar1.stop;
})