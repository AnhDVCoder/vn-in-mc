import mineflayer from "mineflayer";
import chalk from "chalk";
import { Vec3 } from 'vec3';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { delay, datetime, db, printLog, updateTable, setTerminalTitle } from './function.js';

setTerminalTitle("Bot place");

// var conf;
// try {
//     conf = yaml.load(fs.readFileSync('config.yml', 'utf8'));
//   } catch (e) {
//     console.log(e);
// }

const schemFolder = 'server/plugins/FastAsyncWorldEdit/schematics/';
const session = process.argv[2];

db.connect(function(err) {
    if (err) throw err;
    printLog(datetime('time') + '[INFO]: Kết nối thành công tới CSDL!', 'green');
});

updateTable("process_place", "in_process", 0, "in_process", 1);

// Setup global bot arguments
let botArgs = {
    host: 'localhost',
    port: '25565',
    version: '1.20.4'
};

// Bot class
class MCBot {
    // Constructor
    constructor(username, id_bot) { //id, z, x, 
        this.username = username;
        this.host = botArgs["host"];
        this.port = botArgs["port"];
        this.version = botArgs["version"];
        // this.id = id;
        // this.z = z;
        // this.x = x;
        this.id_bot = id_bot;

        // Initialize the bot
        this.initBot();
    }

    // Init bot instance
    initBot() {
        this.bot = mineflayer.createBot({
            "username": this.username,
            "host": this.host,
            "port": this.port,
            "version": this.version
        });

        // Initialize bot events
        this.initEvents();
    }

    // Logger
    log(...msg) {
        console.log(`[${this.username}]`, ...msg);
    }

    // Chat intake logger
    // chatLog(username, ...msg) {
    //     if(!botNames.includes(username)) {
    //         this.log(chalk.ansi256(98)(`<${username}>`), ...msg)
    //     }
    // }

    // Init bot events
    initEvents() {
        
        this.bot.on('login', async () => {
            let botSocket = this.bot._client.socket;
            this.log(chalk.ansi256(34)(`Truy cập vào ${botSocket.server ? botSocket.server : botSocket._host}`));
        });

        this.bot.on('end', async (reason) => {
            

            // Bot peacefully disconnected
            if (reason == "disconnect.quitting") {
                return
            }
            // Unhandled disconnections
            else {
                this.log(chalk.red(`Ngắt kết nối: ${reason}`));
            }

            // Attempt to reconnect
            setTimeout(() => this.initBot(), 5000);
        });

        this.bot.on('spawn', async () => {
            // this.log(chalk.ansi256(46)(`Spawned in`));            
            // run(this.bot, this.id, this.z, this.x, this.id_bot);
            auto_check(this.bot, this.id_bot);
        });

        this.bot.on('error', async (err) => {

            // Connection error
            if (err.code == 'ECONNREFUSED') {
                this.log(`Failed to connect to ${err.address}:${err.port}`)
            }
            // Unhandled errors
            else {
                this.log(`Unhandled error: ${err}`);
            }
        });
    }
}

function check(callback){
    var SQL = 'SELECT PP.id, PP.id_ST, ST.mc_z, ST.mc_x FROM process_place AS PP JOIN session_task AS ST ON PP.id_ST = ST.id WHERE PP.session = ' + session + ' AND PP.in_process = 0 AND PP.complete = 0 ORDER BY PP.id ASC LIMIT 1';
    db.query(SQL, function(err, row) {
        if(err){
            throw err;
        };
        return callback(row);
    })
}

async function auto_check(bot, id_bot){
    check(async function(result){
        if(result.length != 0){
            updateTable('process_place', 'in_process', 1, 'id_ST', result[0].id_ST);
            if (fs.existsSync(schemFolder + result[0].id_ST + '-1' + '.schem') && fs.existsSync(schemFolder + result[0].id_ST + '-2' + '.schem') && fs.existsSync(schemFolder + result[0].id_ST + '-3' + '.schem') && fs.existsSync(schemFolder + result[0].id_ST + '-4' + '.schem')) {
                printLog(datetime('time') + '[INFO]: Tìm thấy [' + result[0].id_ST + ']' , 'white');
                run(bot, result[0].id_ST, result[0].mc_z, result[0].mc_x, id_bot);
            }
            else{
                printLog(datetime('time') + '[ERROR]: Không tìm thấy đủ bản chuyển đổi! [' + result[0].id_ST + ']', 'red');
				printLog(datetime('time') + '[WARN]: Đưa dữ liệu vào hàng đợi chuyển đổi lại! [' + result[0].id_ST + ']', 'yellow');
				removePP(session, result[0].id_ST);
                updatePC(session, result[0].id_ST);
                await delay(1000);
				auto_check(bot, id_bot);
            }
        }
        else{
            printLog(datetime('time') + '[INFO]: Tìm kiếm...', 'white');
			await delay(10000);
			auto_check();
        }
    })
}



function getBot(callback){
    var SQL = 'SELECT id, name FROM bot WHERE in_use = 0 AND error = 0 LIMIT 1';
    db.query(SQL, function(err, row) {
        if(err){
            throw err;
        };
        return callback(row);
    })
}

setBot();

function setBot(){
    getBot(function(result){
        if(result.length != 0){
            let bots = [];
            updateTable('bot', 'in_use', 1, 'id', result[0].id);
            bots.push(new MCBot(result[0].name, result[0].id));
        }
    })
}

async function run(bot, id, z, x, id_bot){
    bot.chat('/tp ' + x + ' -1 ' + z + '');
    bot.chat('//schem load ' + id + '-1' + '.schem');
    bot.chat('//paste');
    await bot.waitForTicks(100);

    bot.chat('/tp ' + (x + 350) + ' -1 ' + z + '');
    bot.chat('//schem load ' + id + '-2' + '.schem');
    bot.chat('//paste');
    await bot.waitForTicks(100);

    bot.chat('/tp ' + x + ' -1 ' + (z + 350) + '');
    bot.chat('//schem load ' + id + '-3' + '.schem');
    bot.chat('//paste');
    await bot.waitForTicks(100);

    bot.chat('/tp ' + (x + 350) + ' -1 ' + (z + 350) + '');
    bot.chat('//schem load ' + id + '-4' + '.schem');
    bot.chat('//paste');
    await bot.waitForTicks(100);

    bot.chat('/tp ' + x + ' -1 ' + z + '');
    check_count(bot, id, z, x, id_bot);
}

async function check_count(bot, id, z, x, id_bot){
    var block = bot.blockAt(new Vec3(x, -1, z));
    var i =  0;
    var flag = true;
    while(block == null || block.displayName == 'Air'){
        if(i == 5){
            flag = false;
            break;
        }
        i++;
        block = bot.blockAt(new Vec3(x, -1, z));
        printLog(datetime('time') + '[INFO]: Kiểm tra... [' + i + '][bot_' + id_bot + ']', 'white');
        await bot.waitForTicks(40);

    }
    if(flag == true){
        for(var index = 1; index <= 2; index++){
            for(var jndex = 1; jndex <= 2; jndex++){
                bot.chat('/tp ' + (x + 175 * index) + ' -1 ' + (z + 175 * jndex));
                await bot.waitForTicks(100);
            }
        }
        bot.chat('/tp ' + (x + 699) + ' -1 ' + (z + 699));
        await bot.waitForTicks(20);
        
        updateTable('process_place', 'in_process', 0, 'id_ST', id);
        updateTable('process_place', 'complete', 1, 'id_ST', id);
        // updateTable('session_task', 'placed', 1, 'id', id);
        
        bot.chat('Done [' + id + ']');
        printLog(datetime('time') + '[INFO]: Hoàn thành [' + id + '][bot_' + id_bot + ']', 'green');
        // for(var i = 1; i <= 4; i++){
        //     fs.rename(schemFolder + id + '-' + i + '.schem', ComplschemFolder + id + '-' + i + '.schem', function (err) {
        //         if (err) throw err
        //     })
        // }
        // printLog(datetime('time') + '[INFO]: Di chuyển vào thư mục hoàn thành! [' + id + '.schem][bot_' + id_bot + ']', 'green');
        // updateTable('bot', 'in_use', 0, 'id', id_bot);
        auto_check(bot, id_bot);
    }
    else{
        updateTable('process_place', 'in_process', 0, 'id', id);
        updateTable('bot', 'error', 1, 'id', id_bot);
        updateTable('bot', 'in_use', 0, 'id', id_bot);
        bot.quit();
        auto_check(bot, id_bot);
    }
}

function updatePC(session, id){
	var SQL  = "UPDATE process_convert SET complete = 0 WHERE session = " + session + " AND id_ST = " + id;
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}

//xóa khỏi hàng đặt khi không tìm thấy dữ liệu(file)
function removePP(session, index){
	var SQL  = "DELETE FROM process_place WHERE session = " + session + " AND id_ST = " + index;
    db.query(SQL, function (error) {
        if (error){
            throw error;
        } 
    });
}



// for(var i = 1; i <= 3; i++){
//     auto_check();
//     await delay(5000);
// }
