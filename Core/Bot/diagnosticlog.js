// Dependencies

const fs = require("fs")
const path = require("path")

// Local Files

const Telegram = require('./telegram')
const config = require('../../config.json')
const Store = require('../storage')
const Log = require('../log').Log
const LogFiles = require('../log').LogFiles

let DiagnosticLog = {
    info: (text) => {
        DiagnosticLog.counter(text)
        if (config.telegram.diagnosticChannel.enable) {
            Telegram.Bot.telegram.sendMessage(`${config.telegram.diagnosticChannel.channel}`, "📄 Info\n" + text)
            DiagnosticLog.attachLog()
        }
    },
    debug: (text) => {
        DiagnosticLog.counter(text)
        if (config.telegram.diagnosticChannel.enable && DiagnosticLog.count == 0) {
            Telegram.Bot.telegram.sendMessage(`${config.telegram.diagnosticChannel.channel}`, "⚙️ Debug\n" + text)
            DiagnosticLog.attachLog()
        }
        Log.debug(text)
    },
    warning: (text) => {
        DiagnosticLog.counter(text)
        if (config.telegram.diagnosticChannel.enable && DiagnosticLog.count == 0) {
            Telegram.Bot.telegram.sendMessage(`${config.telegram.diagnosticChannel.channel}`, "⚠️ Warning\n" + text)
            DiagnosticLog.attachLog()
        }
        Log.warning(text)
    },
    fatal: (text) => {
        DiagnosticLog.counter(text)
        if (config.telegram.diagnosticChannel.enable && DiagnosticLog.count == 0) {
            let stack
            if (__dirname.includes(":\\")) {
                let trimmer = __dirname.replace(/\\Core/gu, "")
                trimmer = trimmer.replace(/\\/gmui, `\\\\\\\\`)
                trimmer = new RegExp(trimmer, "gu")
                stack = JSON.stringify(text.stack).replace(trimmer, ".")
            }
            else {
                let trimmer = new RegExp(__dirname.replace(/\/Core/gu, ""), "gu")
                stack = JSON.stringify(text.stack).replace(trimmer, ".")
            }
            Telegram.Bot.telegram.sendMessage(`@${config.telegram.diagnosticChannel.channel}`, "🚨 Fatal\n" + JSON.parse(stack))
            DiagnosticLog.attachLog()
        }
        Log.fatal(text)
    },
    counter: (text) => {
        Store.find({ key: "logtext" }).then(res => {
            if (text.message == res[0]) {
                DiagnosticLog.count++
            }
            if (text.message != res[0]) {
                DiagnosticLog.count = 0
            }
            Store.insert({ "logtext": text.message ? text.message : "", key: "logtext" })
        }).catch(err => {
            Store.insert({ "logtext": text.message ? text.message : "", key: "logtext" })
        })
    },
    count: 0,
    attachLog: async () => {
        if (config.telegram.diagnosticChannel.enable && config.telegram.diagnosticChannel.attachLog.enable) {
            let numberOfLines = parseInt(config.telegram.diagnosticChannel.attachLog.line)
            if (!isNaN(numberOfLines)) {
                for (let logFile of LogFiles) {
                    let snapshot = await DiagnosticLog.snapshotLogFile(logFile).catch(err => {
                        console.error(err.stack)
                    })
                    let lines = await DiagnosticLog.readLines(snapshot, numberOfLines).catch(err => {
                        console.error(err.stack)
                    })
                    if (lines.length == 0) return
                    let partialSnapshotFile = DiagnosticLog.generateSnapshotFilename(logFile, "partial")
                    let fd = fs.openSync(partialSnapshotFile, 'w')
                    if (fd == undefined) console.error(`Partial log cannot be sent because cannot create file ${partialSnapshotFile}`)
                    for (let line of lines) {
                        fs.writeSync(fd, line)
                        fs.writeSync(fd, "\n")
                    }
                    fs.close(fd)
                    Telegram.Bot.telegram.sendDocument(`@${config.telegram.diagnosticChannel.channel}`, {
                        source: fs.readFileSync(partialSnapshotFile),
                        filename: path.basename(partialSnapshotFile)
                    })
                }
            }
        }
    },
    readLines: (file, num) => {
        return new Promise((resolve, reject) => {
            try {
                let fd = fs.openSync(file, 'r')
                let stat = fs.statSync(file)

                let fileSize = stat.size
                let lines = new Array()
                
                if (fileSize === 0) {
                    resolve(lines)
                } else {
                    let bufferSize = 1024
                    let currentPosition = fileSize - bufferSize
                    if (currentPosition < 0) {
                        currentPosition = 0
                        bufferSize = fileSize
                    }
                    let buffer = new Buffer.alloc(bufferSize)
                    let currentNumberOfLine = num
                    
                    while (true) {
                        fs.readSync(fd, buffer, 0, bufferSize, currentPosition)
                        
                        let lineEnd = bufferSize
                        
                        let bytesLeft = buffer.length
                        
                        for (let i = buffer.length - 1; i >= 0 && currentNumberOfLine != 1; i--) {
                            if (buffer[i] == 0x0A) {
                                let line = buffer.slice(i + 1, lineEnd)
                                lines.push(line.toString())
                                lineEnd = i
                                currentNumberOfLine--
                                bytesLeft = i
                            }
                        }
                        if (currentNumberOfLine != 1) {
                            if (currentPosition >= bufferSize) {
                                currentPosition = currentPosition - bufferSize + bytesLeft
                            } else {
                                if (currentPosition == 0) break
                                
                                bufferSize = bufferSize - currentPosition
                                currentPosition = 0
                            }
                        } else {
                            break
                        }
                    }
                    
                    resolve(lines.reverse())
                }
            }    
            catch (err) {
                reject(err)
            }
        })
    },
    generateSnapshotFilename: (file, postfix = "", snapshotDir = "cache/logs") => {
        return path.join(snapshotDir, path.basename(file).replace(".log", "") + `${postfix.length === 0 ? "" : "-" + postfix}` + ".log")
    },
    snapshotLogFile: (file, midfix = "", snapshotDir = "cache/logs") => {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(snapshotDir)) {
                    fs.mkdirSync(snapshotDir, {recursive: true})
                }
                let snapshotFile = DiagnosticLog.generateSnapshotFilename(file, midfix, snapshotDir)
                fs.copyFileSync(file, snapshotFile)
                resolve(snapshotFile)
            }
            catch (err) {
                reject(err)
            }
        })
    }
}

module.exports = DiagnosticLog
