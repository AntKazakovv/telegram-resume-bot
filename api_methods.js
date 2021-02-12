
export function Bot(config){
    // Создает и возвращает обьект бота с заданным config
    return {
        state: {
            token: config.bot.token,
            timeout: config.server.update_timeout,
            update_id: 0,
            parse_mode: config.bot.parse_mode,
            handlers: {}
        },
        request_tg( methodName, args, method = 'get'){
            /*
                Формирование и отправка запроса к telegram API
             */

            // POST
            if( method == 'post' ){
                return fetch(`https://api.telegram.org/bot${this.state.token}/${methodName}`, 
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(args)
                })

            }
            // GET
            else if ( method == 'get' ){
                let params = ''
                if(args){
                    for(var key in args){
                        params += `&${encodeURIComponent(key)}=${encodeURIComponent(args[key])}`
                    }
                }
                params = '?' + params.slice(1)
                return fetch(`https://api.telegram.org/bot${this.state.token}/${methodName}${params}`)

            }
        },
        add_handler(path, callback){
            this.state.handlers[path] = callback.bind(this)
            
        },
        handler(cur_path, msg){
            for( var path in this.state.handlers ){
                if(cur_path == path){
                    this.state.handlers[path](msg)
                }
            }
        },
        createInlineKeyboard(){
            // создает объект-обертку для inline клавиатуры
            return {
                lines: [],
                marked: [],
                addLineButtons(listButtons){
                    this.lines.push( listButtons )
                },
                get(){
                    return {
                        row_width: 3,
                        inline_keyboard: this.lines
                    }
                },
                mark_button(callback_data){
                    this.lines = this.lines.map( row => {
                        return  row.map( item => {
                            if(item.callback_data == callback_data){
                                item.text = '▪' + item.text + '▪'
                                this.marked.push(item.text)
                            }
                            return item
                        })
                    })
                },
                unmark_buttons(){
                    this.lines.map( row => {
                        return row.map( item => {
                            if( this.marked.indexOf(item.text) != -1 ){
                                item.text = item.text.split('▪')[1]
                            }
                            return item
                        })
                    })
                }
            }
        },
        polling(){
        // Жизненный цикл
            var loop = async () => { // запрос на обновление сообщений
                let resp = await this.request_tg('getUpdates', 
                    this.state.update_id == 0 ? null : {offset: this.state.update_id})
                let result = null
                try{
                    result = await resp.json()
                }
                catch(e){
                    setTimeout( loop, this.state.update_timeout)
                    return 0
                }
                
                if(result.ok){
                    let pool = result.result
                    pool.forEach(msg => { // обход пула сообщений
                        if(msg.callback_query){
                            this.handler(msg.callback_query.data, msg.callback_query.message) 
                            //обработка нажатия на кнопку в сообщении
                        }
                        else{
                            this.handler(msg.message.text, msg.message)
                            // обработка любых других сообщений
                        }
                        this.state.update_id = msg.update_id + 1 // помечаем сообщение как обработанное
                    });
                }
                else{
                    console.error('Запрос на обновление был завершен с ошибкой')
                }

                setTimeout( loop, this.state.update_timeout)
            }
            loop()
        }
    }
}

