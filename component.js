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
    load: (extension_dir = path.join(__dirname, '/Components/')) => {
        try {
            // Init object for later storage
            /**
             * The object that contains the components reflaction function,
             * this Object is loaded by component.js once the app starts up,
             * the later changes can be done through bot command
             * @property {Array} command - Imported from exports.register.commands
             * @property {Array} inline - Imported from exports.register.inline
             * @property {Array} message - Imported from exports.register.message
             */
            let Compo = { command: [], inline: [], message: [] }
            // Read all folders inside the components folder
            var files = fs.readdirSync(extension_dir)
            // Iterial all folders to find the config.json under it
            files.forEach((value, index) => {
                let folder = path.join(extension_dir, value)
                var stats = fs.statSync(folder)
                // Check if folder has config.json
                if (fs.existsSync(folder + "/config.json")) {
                    // Load config.json
                    var compConfig = require(folder + "/config.json")
                    // Check if config has the components key
                    if (compConfig.components) {
                        // Check if this folder is exist
                        if (stats.isDirectory()) {
                            // Iterial each key inside the components config
                            // configValue represents each component name
                            for (let [configKey, configValue] of Object.entries(compConfig.components)) {
                                let compoPath = extension_dir + value + "/" + configValue.name + ".js"
                                let core_exists = fs.statSync(compoPath)
                                if (core_exists && configValue.enable) {
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
                                    loadedPlugins.push(`${Lang.component.loaded[0]} ${configValue.name}@${configValue.version} ${Lang.component.loaded[1]} ${value}`)
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

let loadedPlugins = new Array()

let Interface = {
    Log: Log,
    Message: Message,
    Bot: Bot
}

// Exports

exports.loadedPlugins = loadedPlugins
exports.Interface = Interface
exports.Register = Register