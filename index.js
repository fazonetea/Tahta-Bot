const { create, Client } = require('@open-wa/wa-automate')
const welcome = require('./lib/welcome')
const left = require('./lib/left')
const cron = require('node-cron')
const color = require('./lib/color')
const fs = require('fs')
// const msgHndlr = require ('./tahta')
const figlet = require('figlet')
const options = require('./options')

// AUTO UPDATE BY NURUTOMO
// THX FOR NURUTOMO
// Cache handler and check for file change
require('./tahta.js')
nocache('./tahta.js', module => console.log(`'${module}' Updated!`))

const adminNumber = JSON.parse(fs.readFileSync('./lib/database/admin.json'))
const setting = JSON.parse(fs.readFileSync('./lib/database/setting.json'))
const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting

function restartAwal(tahta){
    setting.restartState = false
    isRestart = false
    tahta.sendText(setting.restartId, 'Restart Succesfull!')
    setting.restartId = 'undefined'
    //fs.writeFileSync('./lib/setting.json', JSON.stringify(setting, null,2));
}

const start = async (tahta = new Client()) => {
        console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
		console.log(color(figlet.textSync('TAHTA BOT', { font: 'Epic', horizontalLayout: 'default' })))
		console.log(color('[SCRIPT BY]', 'orange'), color('FAZONE : SANZKING : GALUH : DIMASDM', 'yellow'))
		console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
		console.log(color('[DEV]'), color('TAHTA BOT', 'red'))
		console.log(color('[~>>]'), color('BOT Started!', 'blue'))
        tahta.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        tahta.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') tahta.forceRefocus()
        })
        // listening on message
        tahta.onMessage((async (message) => {

        tahta.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    tahta.cutMsgCache()
                }
            })
        // msgHndlr(tahta, message)
        // Message Handler (Loaded from recent cache)
        require('./tahta.js')(tahta, message)
    }))
           

        tahta.onGlobalParicipantsChanged((async (heuh) => {
            await welcome(tahta, heuh) 
            left(tahta, heuh)
            }))
        
        tahta.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return tahta.sendText(chat.id, 'Halo aku Elaina, Ketik #help Untuk Melihat List Command Ku...')
            if(mtcState === false){
                const groups = await tahta.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await tahta.sendText(chat.id, 'Maaf, Batas group yang dapat Elaina tampung sudah penuh').then(async () =>{
                        tahta.deleteChat(chat.id)
                        tahta.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await tahta.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            tahta.deleteChat(chat.id)
                            tahta.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) tahta.sendText(chat.id, 'Halo aku Elaina, Ketik #help Untuk Melihat List Command Ku...')
                    }
                }
            }else{
                await tahta.sendText(chat.id, 'Elaina sedang maintenance, coba lain hari').then(async () => {
                    tahta.deleteChat(chat.id)
                    tahta.leaveGroup(chat.id)
                })
            }
        })

        /*tahta.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) tahta.sendSeen(to)
        }))*/

        // listening on Incoming Call
        tahta.onIncomingCall(( async (call) => {
            await tahta.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => tahta.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(tahta => start(tahta))
    .catch((error) => console.log(error))
