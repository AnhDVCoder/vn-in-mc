import { delay, datetime, db, printLog, updateTable, setTerminalTitle } from './function.js';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as yaml from 'js-yaml';
import * as child_process from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

setTerminalTitle("Convert");



const session = process.argv[2];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// var conf;
// try {
//     conf = yaml.load(fs.readFileSync('config.yml', 'utf8'));
//   } catch (e) {
//     console.log(e);
// }

console.log(datetime('datetime'));

db.connect(function(err) {
    if (err) throw err;
    printLog(datetime('time') + '[INFO]: Kết nối thành công tới CSDL!', 'green');
});

updateTable("process_convert", "in_process", 0, "in_process", 1);

auto_check();

async function auto_check(){
	check(async function(result){
		if(result.length != 0){
			printLog(datetime('time') + '[INFO]: Tìm thấy [' + result[1] + '-' + result[2] + ']'), 'white';
			
			if (!fs.existsSync('scans/' + result[1] + '-' + result[2] + '.png')) {
				printLog(datetime('time') + '[ERROR]: Không tìm thấy bản quét! [' + result[1] + '-' + result[2] + ']', 'red');
				printLog(datetime('time') + '[WARN]: Đưa dữ liệu vào hàng đợi quét lại! [' + result[1] + '-' + result[2] + ']', 'yellow');
				updatePS(session, result[1]);
				removePC(session, result[1]);
				await delay(1000);
				auto_check();
			}
			else{
				run(session, result[0], result[1], result[2]);
			}
			var SQL = "SELECT COUNT(complete) AS count FROM process_convert WHERE session = " + session + " AND id_ST = " + result[1] + " AND complete = 1";
			db.query(SQL, function (error, row) {
				if (error){
					throw error;
				}
				if(row[0].count == 4){
					for(var i = 1; i <= 4; i++){
						insertPP(session, id_ST, i);
					}
				}
			});
			
			
		}
		else{
			printLog(datetime('time') + '[INFO]: Tìm kiếm...', 'white');
			await delay(10000);
			auto_check();
		}
	})
}

function check(callback){
	var SQL = 'SELECT id, id_ST, task FROM process_convert WHERE session = ' + session + ' AND in_process = 0 AND complete = 0 ORDER BY id ASC LIMIT 1';
    db.query(SQL, function(err, row) {
        if(err){
            throw err;
        };
        var array = [row[0].id, row[0].id_ST, row[0].task];
        return callback(array);
    })
}

async function run(session, id, id_ST, task){
	const browser=await puppeteer.launch(
		{
			headless:true
		},
		{
			args:[
			'--start-fullscreen'
			]
		}
	);
	
	updateTable('process_convert', 'in_process', 1, 'id', id);
	
	const page=await browser.newPage();

	try {
		await page.goto('http://127.0.0.1:7860/', {waitUntil: 'networkidle2'});
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi tải trang [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_convert', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}
	
	try {
		//Chọn Mine Diffusion
		await page.waitForSelector('#tabs > div.tab-nav.scroll-hide.svelte-kqij2n > button:nth-child(7)', {visible: true});//, timeout: 0
		await page.click('#tabs > div.tab-nav.scroll-hide.svelte-kqij2n > button:nth-child(7)');

		//Chọn danh sách các khối không được phép
		// await page.waitForSelector('#component-1584 > div.tab-nav.scroll-hide.svelte-kqij2n > button:nth-child(2)');
		// await page.click('#component-1584 > div.tab-nav.scroll-hide.svelte-kqij2n > button:nth-child(2)');
		// await page.click('#component-1574');
		// await page.click('#component-1584 > div.tab-nav.scroll-hide.svelte-kqij2n > button:nth-child(1)');
		
		//Chỉnh size schematic 700x700
		await page.focus('#component-3212 > div.wrap.svelte-1cl284s > div > input');
		await page.click('#component-3212 > div.wrap.svelte-1cl284s > div > input', { clickCount: 3 });
		await page.keyboard.type('350');
		await page.focus('#component-3213 > div.wrap.svelte-1cl284s > div > input');
		await page.click('#component-3213 > div.wrap.svelte-1cl284s > div > input', { clickCount: 3 });
		await page.keyboard.type('350');

		//Để đường dẫn export vào thư mục game
		await page.focus('#component-3218 > label > textarea');
		await page.click('#component-3218 > label > textarea', { clickCount: 3 });
		await page.keyboard.type(__dirname + '/server/plugins/FastAsyncWorldEdit/schematics/');
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi không tìm/ấn được Element thanh điều hướng [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_convert', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}

	//Upload ảnh
	try {
		const elementHandle = await page.$("#component-3201 > div.image-container.svelte-p3y7hu > div > input");
		await elementHandle.uploadFile('scans/'+ id_ST + '-' + task + '.png');
		await page.waitForSelector('#component-3201 > div.image-container.svelte-p3y7hu > div > img', {timeout: 60000});
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi upload ảnh! [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_convert', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}
	

	//Điền tên export
	try {
		await page.focus('#component-3219 > label > textarea');
		await page.click('#component-3219 > label > textarea', { clickCount: 3 });
		await page.keyboard.type(id_ST + '-' + task);
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi input! [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_convert', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}
	

	//Export
	try {
		await page.click('#component-3221');
		checkRecord(id_ST, browser, session, task, id);
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi Export! [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_convert', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}
};

async function checkRecord(id_ST, browser, session, task, id){
    var count = 0;
    while(checkLExist(id_ST, task) == 0){
        if(count == 5){
            printLog(datetime('time') + '[INFO]: Không tìm thấy bản ghi! [' + id_ST + '-' + task + ']', 'white');
			updateTable('process_convert', 'in_process', 0, 'id', id);
			await browser.close();
			auto_check();
            return;
        }
        if(checkLExist(id_ST, task) == 0){
            count += 1;
            printLog(datetime('time') + '[INFO]: Kiểm tra bản ghi L... [' + id_ST + '-' + task + '][' + count + ']', 'white');
        }
        await delay(10000);
    }

	printLog(datetime('time') + '[INFO]: Convert thành công sang Litematic [' + id_ST + '-' + task + ']', 'green');

	CTSchem(id_ST, task, browser, session, id);
}

//Check if file Litematic exist
function checkLExist(id_ST, task){
    if(fs.existsSync(__dirname + '/server/plugins/FastAsyncWorldEdit/schematics/' + id_ST + '-' + task + '.litematic')){
        return 1;
    }
    return 0;
}

//Kiểm tra file Schematic
function checkSExist(id_ST, task){
    if(fs.existsSync(__dirname + '/server/plugins/FastAsyncWorldEdit/schematics/' + id_ST + '-' + task + '.schem')){
        return 1;
    }
    return 0;
}

async function CTSchem(id_ST, task, browser, session, id){
	var count = 0;
	var child = child_process.exec('java -jar ./server/plugins/FastAsyncWorldEdit/schematics/Lite2Edit.jar --convert ./server/plugins/FastAsyncWorldEdit/schematics/' + id_ST + '-' + task + '.litematic',
		function (error, stdout, stderr){
			if(error !== null){
				console.log('exec error: ' + error);
			}
		}
	);

	while(checkSExist(id_ST, task) == 0){
        if(count == 5){
            printLog(datetime('time') + '[INFO]: Không tìm thấy bản ghi! [' + id_ST + '-' + task + ']', 'white');
			updateTable('process_convert', 'in_process', 0, 'id', id);
			await browser.close();
			auto_check();
            return;
        }
        if(checkSExist(id_ST, task) == 0){
            count += 1;
            printLog(datetime('time') + '[INFO]: Kiểm tra bản ghi S... [' + id_ST + '-' + task + '][' + count + ']', 'white');
        }
        await delay(10000);
    }

	printLog(datetime('time') + '[INFO]: Convert thành công sang Schematic [' + id_ST + '-' + task + ']', 'green');
			updateTable('process_convert', 'in_process', 0, 'id', id);
			updateTable('process_convert', 'complete', 1, 'id', id);
	

	await delay(1000);

	var SQL = "SELECT COUNT(complete) AS count FROM process_convert WHERE session = " + session + " AND id_ST = " + id_ST + " AND complete = 1";
	db.query(SQL, function (error, result) {
        if (error){
            throw error;
        }
		if(result[0].count == 4){
			for(var i = 1; i <= 4; i++){
				insertPP(session, id_ST, i);
			}
		}
    });

	auto_check();
	await browser.close();
}


function insertPP(session, id_ST, task){
	var SQL  = "INSERT INTO process_place (session, id_ST, task) VALUES (" + session + ", " + id_ST + ", " + task + ")";
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}

function updatePS(session, id_ST){
	var SQL  = "UPDATE process_scan SET complete = 0 WHERE session = " + session + " AND id_ST = " + id_ST;
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}

function removePC(session, id_ST){
	var SQL  = "DELETE FROM process_convert WHERE session = " + session + " AND id_ST = " + id_ST;
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}