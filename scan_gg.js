import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import { delay, updateTable, datetime, printLog, setTerminalTitle, db } from './function.js';

setTerminalTitle("Scan");

const session = process.argv[2];

db.connect(function(err) {
    if (err) throw err;
    printLog(datetime('time') + '[INFO]: Kết nối thành công tới CSDL!', 'green');
});

auto_check();

// var fileSizeMB = fs.statSync('../scan/1301933-1.png').size / (1024*1024);
// console.log(fileSizeMB);

async function auto_check(){
	getData(function(result){
		printLog(datetime('time') + '[INFO]: Đang tiến hành [' + result[3] + ', ' + result[4] + '] [id_ST: ' + result[1] + '] [task: ' + result[2] + ']', 'white');
		// if(result[6] == 1){
		// 	printLog(datetime('time') + '[INFO]: Toàn bộ ID này đã hoàn thành! [' + result[0] + ']', 'yellow');
		// 	printLog(datetime('time') + '[INFO]: Bỏ qua ID này! [' + result[0] + ']', 'yellow');
		// 	updateOPS(result[4]);
		// 	auto_check();
		// }
		// if(result[3] == 1){
		// 	printLog(datetime('time') + '[INFO]: Bản scan ID này đã hoàn thành! [' + result[0] + ']', 'yellow');
		// 	insertOPC(session, result[0], result[5]);
		// 	updateOPS(result[4]);
		// 	auto_check();
		// }
		
		switch(result[2]){
			case 1:
				run(linkOutput(result[3] + 7815, result[4] - 8375), result[1], session, 1, result[0]);
				break;
			case 2:
				run(linkOutput(result[3] + 7815, result[4] + 8375), result[1], session, 2, result[0]);
				break;
			case 3:
				run(linkOutput(result[3] - 7815, result[4] - 8375), result[1], session, 3, result[0]);
				break;
			case 4:
				run(linkOutput(result[3] - 7815, result[4] + 8375), result[1], session, 4, result[0]);
				break;	
		}
		
		
	});
}

function getData(callback){
    var SQL = 'SELECT PS.id, PS.id_ST, PS.task, ST.gg_z, ST.gg_x FROM session_task AS ST JOIN process_scan AS PS ON ST.id = PS.id_ST WHERE PS.session = ' + process.argv[2] + ' AND PS.in_process = 0 AND PS.complete = 0 ORDER BY PS.id ASC LIMIT 1'
    var id = 0, id_ST = 0, z = 0, x = 0, task = 0, status = 0;
    db.query(SQL, function(err, row) {
        if(err){
            throw err;
        }
        else{
            id = row[0].id;
            id_ST = row[0].id_ST;
            z = row[0].gg_z;
            x = row[0].gg_x;
            task = row[0].task;
            // status = row[0].complete;

        }
        var array = [id, id_ST, task, z, x];
        return callback(array);
    })
}

//Đưa toạ độ z, x thành link Google map để scan
function linkOutput(z, x){
    if(z.toString().length > 8){
        var index = 2;
    }
    else{
        var index = 1;
    }
    var Output = 'https://www.google.com/maps/@' + z.toString().slice(0, index) +  '.' + z.toString().slice(-7) + ',' + x.toString().slice(0, 3) +  '.' + x.toString().slice(-7) + ',101m/data=!3m1!1e3?entry=ttu';
    return Output;
}

async function run(link, id_ST, session, task, id){
	updateTable('process_scan', 'in_process', 1, 'id', id);
	
// Chạy browser với chế độ headless:false, tức là có giao diện
	const browser=await puppeteer.launch(
		{
			headless:false
		},
		{
			args:[
			'--start-fullscreen'
			]
		}
	);
	const page=await browser.newPage();
	await page.setViewport({ 'width': 2500, 'height': 2500});
	try {
		await page.goto(link, {waitUntil: 'networkidle2', timeout: 45000});
	} catch (error) {
		updateTable('process_scan', 'in_process', 1, 'id', id);
		printLog(datetime('time') + '[ERROR]: Lỗi tải trang [' + id_ST + ']', 'red');
		auto_check();
		await browser.close();
		return;
	}
	
	//Tắt thanh điều hướng bên trái trang
	try {
		await page.waitForSelector('.wR3cXd', {visible: true});//, timeout: 0
		await page.click('.wR3cXd');
		await page.waitForSelector('.Ud5kdf.LdO2ac.ExdFSd', {visible: true});//, timeout: 0
		await delay(1000);
		await page.click('.Ud5kdf.LdO2ac.ExdFSd');
		await page.waitForSelector('#settings > div > div.hdeJwf.dBl9De > ul > div.lWsJId > button', {visible: true});//, timeout: 0
		// await delay(1000);
		await page.click('#settings > div > div.hdeJwf.dBl9De > ul > div.lWsJId > button');
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi không tìm/ấn được Element thanh điều hướng [' + id_ST + ']', 'red');
		updateTable('process_scan', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;

	}

	await delay(1000);
	//Ẩn label đường
	try {
		await page.waitForSelector('.yHc72.qk5Wte', {visible: true});//, timeout: 0
		await page.hover('.yHc72.qk5Wte');
		await page.waitForSelector('.hYkU8c', {visible: true});//, timeout: 0
		// await delay(1000);
		await page.click('#layer-switcher-quick > div > div > div > ul > li:nth-child(5) > button');
		await page.waitForSelector('.xzUcD', {visible: true});//, timeout: 0
		// await delay(1000);
		await page.click('#layer-switcher > div > div > div > div.yYTQHb > ul > li:nth-child(2) > button');
		await page.click('.g4zD5e');
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi không tìm/ấn được Element label đường [' + id_ST + ']', 'red');
		updateTable('process_scan', 'in_process', 0, 'id', id);
		await browser.close();
	}
	
	await delay(1000);
	//Xóa các Element gồm: Logo, Copyright, Icon chỉ dẫn, tìm kiếm, gợi ý, 3D View, Chuyển bản đồ...
	try {
		const RMElements = [".F63Kk", ".Hk4XGb.Ds12zd", ".app-viewcard-strip.ZiieLd", ".scene-footer", ".hUbt4d-watermark", ".fp2VUc", ".JLm1tf-bEDTcc-GWbSKc.id-omnibox-container", ".gb_eb.gb_3f.gb_J.gb_2f.gb_K", "#gb > div > div"];
		for (var j = 0; j < RMElements.length; j++){
			var div_selector_remove = RMElements[j];
			await page.evaluate((sel) => {
				var elements = document.querySelectorAll(sel);
				for(var i = 0; i< elements.length; i++){
					elements[i].parentNode.removeChild(elements[i]);
				}
			}, div_selector_remove)
		}
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi không xóa được Element [' + id_ST + ']', 'red');
		updateTable('process_scan', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}

	try {
		await page.waitForSelector('#scene > div.iBPHvd.widget-scene > canvas:nth-child(1)', {visible: true});
		await delay(1000);
		await page.screenshot({path:'scans/' + id_ST + '-' + task + '.png', fullPage: true});
		
		
	} catch (error) {
		printLog(datetime('time') + '[ERROR]: Lỗi không load được toàn bộ map [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_scan', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}

	var fileSizeMB = fs.statSync('scans/' + id_ST + '-' + task + '.png').size / (1024*1024);
	if(fileSizeMB < 0.6){
		printLog(datetime('time') + '[ERROR]: Ảnh không đạt tiêu chuẩn! (< 1mb) [' + id_ST + '-' + task + ']', 'red');
		updateTable('process_scan', 'in_process', 0, 'id', id);
		auto_check();
		await browser.close();
		return;
	}

	updatePS(id);
	updateTable('process_scan', 'in_process', 0, 'id', id);
	

	var SQL = "SELECT COUNT(complete) AS count FROM process_scan WHERE session = " + session + " AND id_ST = " + id_ST + " AND complete = 1";
	db.query(SQL, function (error, result) {
        if (error){
            throw error;
        }
		if(result[0].count == 4){
			for(var i = 1; i <= 4; i++){
				insertPC(session, id_ST, i);
			}
			printLog(datetime('time') + '[INFO]: Hoàn thành [' + id_ST + ']', 'green');
		}
    });
	
	auto_check();
	await browser.close();
};

//Sau khi scan xong, cho vào hàng chờ convert sang Litematic
function insertPC(session, id_ST, task){
	var SQL  = "INSERT INTO process_convert (session, id_ST, task) VALUES (" + session + ", " + id_ST + ", " + task + ")";
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}

function updatePS(id){
	var SQL  = "UPDATE process_scan SET complete = 1 WHERE id = " + id;
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}



