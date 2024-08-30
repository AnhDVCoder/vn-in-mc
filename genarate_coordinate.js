import { datetime, db, printLog } from './function.js';
import cliProgress from 'cli-progress'

//Kết nối tới database
db.connect(function(err) {
    if (err) throw err;
    printLog(datetime('time') + '[INFO]: Kết nối thành công tới CSDL!', 'green');
});

//Dữ liệu vào

//Đặt toạ độ Google map tương ứng với toạ độ 0 0 0 trong Minecraft


//Toạ độ Minecraft
let session = 1;
var coord_x = 0;
var coord_z = 0;

//Bán kính
let radius = 7;
let R = radius * 2 + 1;
let C = radius * 2 + 1;

var arr = findCoordinateByMC(coord_x, coord_z);

ReversespiralPrint(R, C, arr[2], arr[3], radius, session);

//Ngắt kết nối với database
// db.end();

//Tạo dữ liệu theo hình vòng xoáy từ ngoài vào tâm
function ReversespiralPrint(row, col, coord_x, coord_z, radius, session)
{
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    bar1.start(row * col, 0);
    var arr = [];

    var temp_coord_x = coord_x - (700 * radius);
    var temp_coord_z = coord_z - (700 * radius);

    let i;
    let z = 0; 

    let start_row = 0;
    let start_col = 0;

    var count = 0;
  
    while (start_row < row && start_col < col) 
    { 
        for (i = start_col; i < col; i++) 
        {
            arr = findCoordinateByMC(temp_coord_x, temp_coord_z);
            insertST(session, arr[0], arr[1], arr[2], arr[3]);
            z++;
            temp_coord_x += 700;
            count++;
        } 
        start_row++;
        temp_coord_x -= 700;
        temp_coord_z += 700; 
  

        for (i = start_row; i < row; ++i) 
        {
            arr = findCoordinateByMC(temp_coord_x, temp_coord_z);
            insertST(session, arr[0], arr[1], arr[2], arr[3]);
            ++z;
            temp_coord_z += 700;
            count++
        } 
        col--;
        temp_coord_x -= 700;
        temp_coord_z -= 700;
  

        if (start_row < row)
        { 
            for (i = col-1; i >= start_col; --i) 
            { 
                arr = findCoordinateByMC(temp_coord_x, temp_coord_z);
                insertST(session, arr[0], arr[1], arr[2], arr[3]);
                ++z;
                temp_coord_x -= 700;
                count++;
            } 
            row--;
            temp_coord_x += 700;
            temp_coord_z -= 700;
        } 
  

        if (start_col < col) 
        {
            for (i = row-1; i >= start_row; --i) 
            { 
                arr = findCoordinateByMC(temp_coord_x, temp_coord_z);
                insertST(session, arr[0], arr[1], arr[2], arr[3]);
                ++z;
                temp_coord_z -= 700;
                count++;
            } 
            start_col++;
            temp_coord_x += 700;
            temp_coord_z += 700;
        }
        bar1.update(count);
    }
    bar1.stop();
}

//Dựa trên toạ độ của minecraft tính ra toạ độ google map
function findCoordinateByMC(x, z){
    var def_gg_coordinate = [210278600, 1058523000];

    var def_gg_z = def_gg_coordinate[0];
    var def_gg_x = def_gg_coordinate[1];
    var mc_x, mc_z, gg_x, gg_z;

    if(x >= 0){
        if(((x - 350) / 700) < 0){
            mc_x = (parseInt((x - 350) / 700) * 700 + 350) * -1;
            gg_x = def_gg_x + (((parseInt((x - 350) / 700)) * 33500) * -1);
        }
        else{
            mc_x = parseInt((x - 350) / 700) * 700 + 350;
            gg_x = def_gg_x + ((parseInt((x - 350) / 700) + 1) * 33500);
        }
    }
    else{
        if(((x + 350) / 700) > 0){
            mc_x = (parseInt((x + 350) / 700) * 700 + 350) * -1;
            gg_x = def_gg_x + ((parseInt((x + 350) / 700) * 33500) * -1);
        }
        else{
            if(parseInt((x + 350) / 700) != ((x + 350) / 700)){
                mc_x = (parseInt((x + 350) / 700) - 1) * 700 - 350;
                gg_x = def_gg_x + ((parseInt((x + 350) / 700) - 1) * 33500);
            }
            else{
                mc_x = parseInt((x + 350) / 700) * 700 - 350;
                gg_x = def_gg_x + (parseInt((x + 350) / 700) * 33500);
            }
        }
    }
    
    if(z <= 0){
        if(((z + 350) / 700) > 0){
            mc_z = (parseInt((z + 350) / 700) * 700 + 350) * -1;
            gg_z = def_gg_z + ((parseInt((z + 350) / 700) * 31260));
        }
        else{
            if(parseInt((z + 350) / 700) != ((z + 350) / 700)){
                mc_z = (parseInt((z + 350) / 700) - 1) * 700 - 350;
                gg_z = def_gg_z + ((parseInt((z + 350) / 700) - 1) * -31260);
            }
            else{
                mc_z = parseInt((z + 350) / 700) * 700 - 350;
                gg_z = def_gg_z + (parseInt((z + 350) / 700) * -31260);
            }
        }
    }
    else{
        if(((z - 350) / 700) < 0){
            mc_z = (parseInt((z - 350) / 700) * 700 + 350) * -1;
            gg_z = def_gg_z - (((parseInt((z - 350) / 700) + 1) * 31260));
        }
        else{
            mc_z = parseInt((z - 350) / 700) * 700 + 350;
            gg_z = def_gg_z - ((parseInt((z - 350) / 700) + 1) * 31260);
        }
    }
    var arr = [gg_z, gg_x, mc_x, mc_z];
    return arr;
}

//Thêm dữ liệu vào bảng session_task
function insertST(session, gg_z, gg_x, mc_x, mc_z){
    var SQL = 'SELECT COUNT(1) AS count FROM session_task WHERE session = ' + session + ' AND mc_x = ' + mc_x + ' AND mc_z = ' + mc_z;
    db.query(SQL, function (error, results) {
        if (error){
            throw error;
        }
        if(results[0].count == 0){
            var SQL = 'INSERT INTO session_task (session, gg_z, gg_x, mc_x, mc_z) VALUES (' + session + ', ' + gg_z + ', ' + gg_x + ', ' + mc_x + ', ' + mc_z + ')';
            db.query(SQL, function (error) {
                if (error){
                    throw error;
                }
            });
        }
    });
}