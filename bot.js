import { Bot } from "./api_methods.js"
import { map_pages } from './routes.js'
// Reading config
const config = JSON.parse( Deno.readTextFileSync('config.json') )
//--------------


console.log('Starting web server...')
let bot = Bot(config)


map_pages.forEach( item => {
    item.content = Deno.readTextFileSync(`./pages/${item.path}.html`)
})

let keyboard_menu = bot.createInlineKeyboard()
// keyboard_menu.addLineButtons(
//     map_pages.map( item => { return {text: item.name, callback_data: item.path} })
// )
keyboard_menu.lines = [[
        {
            text: map_pages[0].name,
            callback_data: map_pages[0].path
        },
        {
            text: map_pages[1].name,
            callback_data: map_pages[1].path
        },
    ],
    [
        {
            text: map_pages[2].name,
            callback_data: map_pages[2].path     
        },
        {
            text: map_pages[3].name,
            callback_data: map_pages[3].path
        },
        {
            text: map_pages[4].name,
            callback_data: map_pages[4].path
        },
    ]
]


bot.add_handler('/start', function (msg){
    keyboard_menu.unmark_buttons()
    keyboard_menu.mark_button(map_pages[0].path)
    this.request_tg( 'sendMessage',
    {
        chat_id: msg.chat.id,
        text: map_pages[0].content,
        parse_mode: this.state.parse_mode,
        reply_markup: keyboard_menu.get()
    }, 'post')//.then( resp => console.log(resp))
})

// генерируем хэндлеры для каждой страницы
map_pages.forEach(element => {
    bot.add_handler(element.path, function (msg){
        keyboard_menu.unmark_buttons()
        keyboard_menu.mark_button(element.path)

        this.request_tg( 'editMessageText',
            {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                text: element.content,
                parse_mode: this.state.parse_mode,
                reply_markup: keyboard_menu.get()
            }, 'post')//.then( resp => console.log(resp))
        })    
});

bot.polling()
