// Dependecies

const axios = require('axios')

let Compo = require('../../component')

// Component Method

let config = require('./config.json')

let main = {
    wiki: async function (query, lang) {
        return axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
            params: {
                format: "json",
                action: "query",
                prop: "extracts",
                exintro: true,
                explaintext: true,
                redirects: 1,
                titles: query
            }
        }).then(res => {
            if (res.data.hasOwnProperty("query")) {
                let pages = res.data.query.pages
                if (!pages.hasOwnProperty("-1")) {
                    let pageNum = Object.keys(pages).map(item => item.match(/\d+/)).pop()
                    return {
                        lang: lang,
                        title: pages[pageNum].title,
                        caption: pages[pageNum].extract.slice(0, 25) + "...",
                        content: `*${pages[pageNum].title}* [@Wikipedia](https://${lang}.wikipedia.org/wiki/${query})` + "\n" + pages[pageNum].extract
                    }
                }
                return undefined
            }
        }).catch(err => {
            return err
        })
    }
}

// Change the Component Name according to the config.json

exports.meta = config.components.wiki

// Inner

exports.commands = {
    main: async function () {

    }
}

exports.inlines = {
    main: async function (ctx) {
        let globalPattern = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/gumi
        if (!globalPattern.test(ctx.inlineQuery.query) && ctx.inlineQuery.query != "") {
            Compo.Interface.Log.Log.info(`${ctx.from.first_name} 发起了 Wikipedia 查询 ${ctx.inlineQuery.query}`)
            let data = await main.wiki(ctx.inlineQuery.query, "zh").catch(err => {
                this.DiagnosticLog.fatal(err)
                return undefined
            })
            if (data instanceof Error) {
                this.DiagnosticLog.fatal(err)
                return undefined
            }
            else if (data != undefined) {
                return [{
                    type: "article",
                    id: ctx.inlineQuery.id,
                    title: `${data.title}`,
                    description: data.caption,
                    thumb_url: "https://i.loli.net/2019/11/06/Om7oWzkAMRZl5sc.jpg",
                    input_message_content: { message_text: `${data.content}`, parse_mode: "Markdown" },
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: "Wikipedia Page",
                                url: `https://en.wikipedia.org/wiki/${ctx.inlineQuery.query}`,
                            }
                        ]]
                    }
                }]
            }
            else {
                data = await main.wiki(ctx.inlineQuery.query, "en")
                if (data != undefined) {
                    return [{
                        type: "article",
                        id: ctx.inlineQuery.id,
                        title: `${data.title}`,
                        description: data.caption,
                        thumb_url: "https://i.loli.net/2019/11/06/Om7oWzkAMRZl5sc.jpg",
                        input_message_content: { message_text: `${data.content}`, parse_mode: "Markdown" },
                        reply_markup: {
                            inline_keyboard: [[
                                {
                                    text: "Wikipedia Page",
                                    url: `https://zh.wikipedia.org/wiki/${ctx.inlineQuery.query}`,
                                }
                            ]]
                        }
                    }]
                }
            }
            return undefined
        }
        return undefined
    }
}

exports.messages = {
    main: async function (ctx) {

    }
}

exports.callbackQuery = {
    main: async function () {

    }
}

// Register

exports.register = {
    // As the example to Yawarakai Compos
    commands: [
        // {
        //     // function: 'main'
        // }
    ],
    inlines: [
        {
            function: "main"
        }
    ],
    messages: [
        // {
        //     // function: 'main'
        // }
    ],
    callbackQuery: [
        // {
        //     function: 'main'
        // }
    ]
}