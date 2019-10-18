// Dependencies

let fs = require('fs')
let path = require('path')

// Local Files

let Log = require('./Core/log')
let Lang = require('./Core/lang').Lang
let Bot = require('./Core/bot')
let Message = require('./Core/Bot/message')

// Body

let Register = {
    load: (extension_dir = __dirname + '/Components/') => {
        try {
            let Compo = { command: [], inline: [], message: [] }
            var files = fs.readdirSync(extension_dir)
            files.forEach((value, index) => {
                let folder = path.join(extension_dir, value)
                var stats = fs.statSync(folder)
                if (fs.existsSync(folder + "/config.json")) {
                    var compConfig = require(folder + "/config.json")
                    Compo = { command: [], inline: [], message: [] }
                    if (compConfig.components) {
                        if (stats.isDirectory()) {
                            for (let [configKey, configValue] of Object.entries(compConfig.components)) {
                                let compoPath = extension_dir + value + "/" + configValue.name + ".js"
                                let core_exists = fs.statSync(compoPath)
                                if (core_exists) {
                                    let compo = require(compoPath)
                                    // Check if register commands exist
                                    if (compo.register.commands) {

                                        compo.register.commands.map(cmd => {
                                            cmd.instance = compo.commands[cmd.cmdReg]
                                            cmd.meta = compo.meta
                                            Compo.command.push(cmd)
                                        })
                                    }
                                    // Check if register inlines exist
                                    if (compo.register.inlines) {
                                        compo.register.inlines.map(iln => {
                                            iln.instance = compo.inlines[iln.ilnReg]
                                            iln.meta = compo.meta
                                            Compo.inline.push(iln)
                                        })
                                    }
                                    // Check if register inline exist
                                    if (compo.register.message) {
                                        compo.register.message.map(msg => {
                                            msg.instance = compo.message[msg.msgReg]
                                            msg.meta = compo.meta
                                            Compo.message.push(msg)
                                        })
                                    }
                                    Log.Log.info(`${Lang.component.loaded[0]} ${configValue.name}@${configValue.version} ${Lang.component.loaded[1]} ${value}`)
                                }
                                else {
                                    Log.Log.info(Lang.component.readIn + compConfig.groupname + Lang.component.loaded[1] + value)
                                    return
                                }
                            }
                        }
                    }
                    else { Log.Log.fatal(Lang.component.configFileInvalid + folder + "/config.json") }
                }
            })
            return Compo
        } catch (error) {
            Log.Log.fatal(error)
        }
    }
}

let Interface = {
    Log: Log,
    Message: Message,
    Bot: Bot
}

// Exports

exports.Interface = Interface
exports.Register = Register