/** Imports */

// const YTDlpWrap = require('yt-dlp-wrap').default;
// const ytDlpWrap = new YTDlpWrap('/usr/local/bin/yt-dlp');

var ADMIN = '1069831649';

var shortid = require('shortid');

var http = require('http');

const { Curl } = require('node-libcurl');

var exec = require('child_process').exec;

const TelegramBot = require('node-telegram-bot-api');

const i18n = require('./i18n.js');

const Cliente = require('./Cliente');
const Order = require('./Order');

const Indication = require('./Indication');

const database = require('./db');

const { create } = require('domain');

const { Table } = require('console-table-printer');

const format = require('date-format');

const Sequelize = require('sequelize');

const moment = require("moment");

var promocao = 2;

//DESENVOLVIMENTO
//  let publicKeyML = 'TEST-9a65716f-a1fa-4a23-8152-eac77271bcae';
//  let accessToken = 'TEST-4788801943068672-032721-c9e6cbd022064bda1cf9c41260deaf94-1096864621';
//  const token = '5297559808:AAFwjOXIeBbsK9vY0KMMIn1fvaJWCC2ooZ4';


//PRODUCAO
  let publicKeyML = 'APP_USR-b4a9f9a4-65a7-43fa-9ec7-d0602649d2a5';
  let accessToken = 'APP_USR-4788801943068672-032721-91c00f28ae8c5d6e498ca558961c1f62-1096864621';
  const token = '5256485733:AAEKTjfqE6DEgb8IB6Lhspb6UT3bYCkccuo';

var mercadopago = require('mercadopago');

var lang = 'pt-br';

const minExpired = 1440;


(async () => {
    try {
        const resultado = await database.sync({alter: true});

    } catch (error) {
        console.log(error);
    }
})();


const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start(.*)/, (msg, match) => {
    console.log(msg);
    console.log(match);
    console.log(match[1].trim());
    getClienteByCodigo(match[1].trim()).then(cliente => {
        if(cliente && cliente.codigo){
            getClienteByCodigo(msg.from.id).then(novoCliente => {
                if (novoCliente == null && msg.from.id != cliente.codigo) {
                    cliente.pontos = cliente.pontos + 5;
                    cliente.save();
                    Indication.create({
                        cliente_origem: cliente.codigo,
                        cliente_destino: msg.from.id,
                        pontos: 5
                    });
                } else {
                    console.log('nao eh um novo usuario');
                }
            });
        }    

    });
});



bot.on('message', async (msg) => {
    lang = msg.from.language_code;
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '💰 ' + i18n.getString('label.global.mypoints', lang),
                        callback_data: 'mypoints'
                    },
                    {
                        text: '💸 ' + i18n.getString('label.global.buypoints', lang),
                        callback_data: 'buypoints'
                    }
                ],
                [
                    {
                        text: '👥 ' + i18n.getString('label.global.indication', lang),
                        callback_data: 'indication'
                    }

                ]
            ]
        }
    };

    const chatId = msg.chat.id;
    
    let cliente = await getCliente(msg);
    let nome = '';
    if(cliente != null && cliente.nome != null){
        nome = cliente.nome;
    }
    if (msg.text.includes('http')) {
        if (msg.text.includes('xvideos')) {
            if(cliente != null && typeof cliente.pontos !== "undefined"){
                console.log(format.asString('dd/MM/yy hh:mm:ss',new Date())+': '+nome+' ('+cliente.pontos+'): '+msg.text);    
            }else{
                console.log(format.asString('dd/MM/yy hh:mm:ss',new Date())+': '+nome+': '+msg.text);
            }
            if (cliente.codigo == ADMIN ||  (typeof cliente.pontos !== "undefined" && cliente.pontos > 0)) {
                bot.sendMessage(msg.chat.id, i18n.getString('label.global.waitextractvideo', lang));
                executar(msg, cliente, bot);
            } else {
                bot.sendMessage(msg.chat.id, i18n.getString('label.global.insufficientpoints', lang),opts);
            }
        }
        else {
            console.log('Video errado:'+msg.text);
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.errorvideoformat', lang));
        }

    } else if(msg.text.includes('delete452@!')){
        User.destroy({
            where: {
                codigo: '5161316211'
            }
          });
        
    } else if(msg.text.includes('admin452@!')){
        adminBot(bot,msg);
    
    }else if(msg.text.includes('promocao452@!')){
        enviarPromocao(bot,msg);        

    }else {
        if(cliente != null && typeof cliente.pontos !== "undefined" ){
            console.log(nome +' ('+cliente.pontos+'): '+msg.text);
        }else{
            console.log(nome +': '+msg.text);
        }
        //let hello = 'ESTAMOS EM MANUTENÇÃO... AGUARDE UM MOMENTO \n';
        let promo = i18n.getString('label.global.promotion', lang);
        await bot.sendMessage(chatId, promo);
        
        let hello = i18n.getString('label.global.hi', lang) + ', ' + nome + '\n' + i18n.getString('label.global.pasteurl', lang);
        bot.sendMessage(chatId, hello, opts);
    }

});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;

    let cliente = await getClienteChat(msg);

    let text = 'Qualquer coisa';

    if (action === 'mypoints') {
        if(cliente){
            text = i18n.getString('label.global.points', lang) + ': ' + cliente.pontos;
            bot.sendMessage(msg.chat.id, text);
        }
    } else if (action === 'buypoints') {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: i18n.getString('label.global.credit1dolar', lang),
                            callback_data: '1dolar'
                        },
                        {
                            text: i18n.getString('label.global.credit5dolar', lang),
                            callback_data: '5dolar'
                        }
                    ],
                    [
                        {
                            text: i18n.getString('label.global.credit10dolar', lang),
                            callback_data: '10dolar'
                        },
                        {
                            text: i18n.getString('label.global.credit20dolar', lang),
                            callback_data: '20dolar'
                        }

                    ]
                ]
            }
        };
        let promo = i18n.getString('label.global.promotion', lang);
        let hello = i18n.getString('label.global.howmanypointsbuy', lang);
        await bot.sendMessage(msg.chat.id, promo);
        bot.sendMessage(msg.chat.id, hello, opts);

    } else if (action === '1dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy1dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '5.00', cliente.codigo, 15, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));
   
    } else if (action === '5dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy5dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '15.00', cliente.codigo, 55, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));
    
    } else if (action === '10dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy10dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '30.00', cliente.codigo, 120, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));
   
    } else if (action === '20dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy20dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '60.00', cliente.codigo, 250, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));

    } else if (action === 'indication') {

        bot.sendMessage(msg.chat.id, i18n.getString('label.global.textindication0', lang) + cliente.codigo);
        let text = i18n.getString('label.global.textindication1', lang) + "\n\n";
        text += i18n.getString('label.global.textindication2', lang) + "\n";
        bot.sendMessage(msg.chat.id, text);
    }


});

adminBot = async (bot,msg)=>{
    let Op = Sequelize.Op;
    let clientes = await Cliente.count({});
    let ordersOpened = await Order.count({where: {data_pagamento: null}});
    let ordersPay = await Order.count({where: {status: 'APPROVED'}});
    let pointsActive = await Cliente.sum('pontos', {});
    let indications = await Indication.count({});
    let ordersExpired = await Order.count({where: {status: 'EXPIRED'}});
    let sumOrdersPay = await Order.sum('valor', { where: { status: 'APPROVED' } });
    
    let ultimosClientes = await Cliente.findAll({limit: 5,order: [['id', 'DESC']]}).catch(e=>console.log(e));
    let clientesMaisPontos = await Cliente.findAll({limit: 5,order: [['pontos', 'DESC']]}).catch(e=>console.log(e));
    let clientesMenosPontos = await Cliente.findAll({where: {pontos: {[Op.not]:0}},limit: 9,order: [['pontos', 'ASC']]}).catch(e=>console.log(e));
    
    let ultimasOrders = await Order.findAll({limit: 10,order: [['id', 'DESC']]}).catch(e=>console.log(e));
    let text =  '<b>Geral</b> \n';  
        text +=  '<code>';
        text +=     '<b>Clientes Cadastrados:</b>'+clientes +'\n';
        text +=     '<b>Pagamentos em Aberto:</b>'+ordersOpened +'\n';
        text +=     '<b>Pagamentos Efetuados:</b>'+ordersPay +'\n';
        text +=     '<b>Pontos Ativos:</b>'+pointsActive +'\n';
        text +=     '<b>Indicações:</b>'+indications +'\n';
        text +=     '<b>Pagamentos Expirados:</b>'+ordersExpired +'\n';
        text +=     '<b>Total Recebido:</b>'+sumOrdersPay +'\n';
        text +=  '</code>';
        text +=  '--------------------------------------------\n';
        text +=  '<b>Ultimos Clientes</b> \n';  
        text +=  '<code>';
        ultimosClientes.forEach(cliente=>{
            text += cliente.pontos +' | '+ cliente.codigo +' | '+ cliente.nome+'\n';
        })          
        text +=  '</code>'; 

        text +=  '--------------------------------------------\n';
        text +=  '<b>Clientes Mais Pontos</b> \n';  
        text +=  '<code>';
        clientesMaisPontos.forEach(cliente=>{
            if(cliente.codigo != ADMIN){
                text += cliente.pontos +' | '+ cliente.codigo +' | '+ cliente.nome+'\n';
            }    
        })          
        text +=  '</code>'; 


        text +=  '--------------------------------------------\n';
        text +=  '<b>Clientes Menos Pontos</b> \n';  
        text +=  '<code>';
        clientesMenosPontos.forEach(cliente=>{
            if(cliente.codigo != ADMIN){
                text += cliente.pontos +' | '+ cliente.codigo +' | '+ cliente.nome+'\n';
            }
            
        })          
        text +=  '</code>';
        
        
        text +=  '--------------------------------------------\n';
        text +=  '<b>Ultimas Vendas</b> \n';  
        text +=  '<code>';
        ultimasOrders.forEach(order=> {
            text += '| '+order.createdAt.toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"})+'| '+order.status+' | '+order.valor+' | '+order.cliente+'\n';
        })          
        text +=  '</code>'; 



    bot.sendMessage(msg.chat.id, text,{parse_mode : "HTML"});

}
//AQUI
enviarPromocao = async (bot,msg)=>{
    lang = 'pt-br';
    let Op = Sequelize.Op;

    Cliente.findAll({
        logging: console.log,
        where: {
            pontos: {[Op.lt]:25},
            chatId: {[Op.ne]:null},
            [Op.or]: [{data_aviso_promocao: null}, {data_aviso_promocao:  { [Sequelize.Op.lte]: (moment().subtract(15, 'days').toDate()) }}]
        }
        ,limit: 500
        }).then(async clientes =>{
            console.log('Clientes: '+clientes.length); 
            await bot.sendMessage(msg.from.id, 'Clientes: '+clientes.length);
            clientes.forEach(async cliente =>{
                try {
                console.log('CLIENTE: '+cliente.nome+ ', PONTOS: '+cliente.pontos);
                const opts = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: i18n.getString('label.global.credit1dolar', lang),
                                    callback_data: '1dolar'
                                },
                                {
                                    text: i18n.getString('label.global.credit5dolar', lang),
                                    callback_data: '5dolar'
                                }
                            ],
                            [
                                {
                                    text: i18n.getString('label.global.credit10dolar', lang),
                                    callback_data: '10dolar'
                                },
                                {
                                    text: i18n.getString('label.global.credit20dolar', lang),
                                    callback_data: '20dolar'
                                }
        
                            ]
                        ]
                    }
                };
                let promo = i18n.getString('label.global.promotion', lang);
                let hello = i18n.getString('label.global.howmanypointsbuy', lang);
                await bot.sendMessage(cliente.chatId, promo);
                await bot.sendMessage(cliente.chatId, hello, opts);
                cliente.data_aviso_promocao = new Date();
                cliente.save();
                console.log('CLIENTE: '+cliente.nome+ ', PONTOS: '+cliente.pontos);
                } catch (error) {
                    console.log(error.message);
                    console.log('Erro ao enviar a promoção para o cliente: '+cliente.nome);
                    cliente.data_aviso_promocao = new Date();
                    cliente.save();    
                }
            });

        }).catch(e =>{
            console.log('ERROR:');
            console.log(e);
        });

};    


async function executar(msg, cliente, bot) {
    let count = 0;
    while(! await lerCodigoFonte(msg, cliente, bot) && count < 5){
        count++;
    }
}

async function lerCodigoFonte(msg, cliente, bot) {
    console.log('leu o codigo fonte');
    const curl = new Curl();
    curl.setOpt('URL', msg.text);
    curl.setOpt('FOLLOWLOCATION', true);
    curl.setOpt(Curl.option.COOKIEFILE, './cookies.txt');
    curl.setOpt(Curl.option.HTTPHEADER, ['User-Agent: Mozilla/5.0', 'Content-Type: application/x-www-form-urlencoded']);
    curl.setOpt(Curl.option.VERBOSE, false);
    curl.on('end', function (statusCode, data, headers) {
        let videoOnline;
        let videoHigh;
        let videoLow;
        let thumb;
        let name;
        let title;
        //console.log(data);   
        
        if(data.includes('Network error. Please refresh the page')){
            console.log('ENCONTROU O ERRO DE REDE');
            return false;
        }

        data.split(/\r?\n/).forEach(function (line) {
            //console.log(line);
            if (line.includes('html5player.setVideoTitle(')) {
                title = line.substring(line.indexOf('VideoTitle(') + 12, line.length - 3);

            } else if (line.includes('html5player.setVideoHLS(')) {
                videoOnline = line.substring(line.indexOf('HLS(') + 5, line.length - 3);

            } else if (line.includes('html5player.setVideoUrlHigh(')) {
                videoHigh = line.substring(line.indexOf('High(') + 6, line.length - 3);

            } else if (line.includes('html5player.setVideoUrlLow(')) {
                videoLow = line.substring(line.indexOf('Low(') + 5, line.length - 3);                

            } else if (line.includes('html5player.setThumbUrl(')) {
                thumb = line.substring(line.indexOf('ThumbUrl(') + 10, line.length - 3);
            }

        });


        if(videoOnline && videoHigh){
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.linkassistironline', lang) + '\n' + videoOnline);
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.linkparadownload', lang) + '\n' + videoHigh);
            descontarPonto(cliente);
        }else if(videoLow){
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.linkparadownload', lang) + '\n' + videoLow);
            descontarPonto(cliente);
        }
        else{
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.errovideopremium', lang));
            //console.log(data);
        }
        
        this.close();
    });

    curl.on('error', function (error, errorCode) {
        this.close()
    });
    curl.perform();
    return true;
}    

async function descontarPonto(cliente) {
    if(cliente.codigo != ADMIN){
        cliente.pontos = cliente.pontos - 1;
        cliente.save();
    }
    
}

async function getCliente(msg) {
    return Cliente.findAll({
        where: {
            codigo: msg.from.id
        }
    }).then(clientes => {
        let cliente;
        if (clientes.length === 0) {
            let nomeC = '';
            nomeC += msg.from.first_name?msg.from.first_name:'';
            nomeC += msg.from.last_name?' '+msg.from.last_name:'';
            cliente = Cliente.create({
                codigo: msg.from.id,
                nome: nomeC,
                pontos: 15,
                chatId: msg.chat.id
            }).catch(e =>{});
        } else {
            cliente = clientes[0];
        }
        return cliente;
    });
}

async function getClienteChat(msg) {

    return Cliente.findAll({
        where: {
            codigo: msg.chat.id
        }
    }).then(clientes => {
        let cliente;
        if (clientes.length === 0) {
            let nomeC = '';
            nomeC += msg.chat.first_name?msg.chat.first_name:'';
            nomeC += msg.chat.last_name?' '+msg.chat.last_name:'';
            cliente = Cliente.create({
                codigo: msg.chat.id,
                nome: nomeC,
                pontos: 30
            }).catch(e =>{});
        } else {
            cliente = clientes[0];
        }
        return cliente;
    });
}

async function getClienteByCodigo(cod) {

    return Cliente.findAll({
        where: {
            codigo: cod
        }
    }).then(clientes => {
        let cliente;
        if (clientes.length === 0) {

        } else {
            cliente = clientes[0];
        }
        return cliente;
    });
}

function execute(command, callback) {
    exec(command, function (error, stdout, stderr) { callback(stdout); });
};


async function gerarCobrancaMercadoPago(moeda, valor, cliente, pontos, msgId) {

    mercadopago.configure({
        access_token: accessToken
    });

    let uid = shortid.generate();
    
    var preference = {
    items: [
        {
        title: uid,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: Number.parseInt(valor)
        }
    ]
    };

    let createOrder = async function () {
        response = await mercadopago.preferences.create(preference);
        console.log(JSON.stringify(response));
        Order.create({
                cliente: cliente,
                transacao: response.body.id,
                currency_code: moeda,
                valor: valor,
                status: 'CREATED',
                pontos: pontos,
                uid:uid,
                id_chat: msgId
            }).catch(e => {
                console.log(e);
            });
            return response.body.id;
    }    
    return createOrder();
}




let captureOrder = async function (element) {
    
    
    let diff = Math.abs(element.createdAt - new Date());
    let minutes =  Math.floor((diff/1000)/60)
    if (parseInt(minutes) < minExpired) {
        mercadopago.configure({
            access_token: accessToken
        });
       
        var filters = {
            range: 'date_created',
            begin_date: 'NOW-1MONTH',
            end_date: 'NOW',
            status: 'approved',
            description: element.uid,
            operation_type: 'regular_payment'
          };

        req = await mercadopago.payment.search({qs: filters}).catch(function (error) {console.log(error)});
        //console.log(JSON.stringify(req));
        req.body.results.forEach(async (pagamento) =>{
            if(element.uid === pagamento.description){

             element.status = 'APPROVED';
             element.data_pagamento = new Date();
             element.save();

            let clienteEspera = await getClienteByCodigo(element.cliente);
            clienteEspera.pontos = clienteEspera.pontos + (element.pontos * promocao);
            clienteEspera.save();

            enviarMensagemAtivo(element.id_chat, i18n.getString('label.global.messagebuycongratulation', lang));
            enviarMensagemAtivo(element.id_chat, i18n.getString('label.global.messagebuypointscongratulation', lang) + ' ' + (element.pontos * promocao) + ' ' + i18n.getString('label.global.points', lang));

            }
        });

    } else {
        element.status = 'EXPIRED';
        element.data_pagamento = new Date();
        element.save();
    }
}

enviarMensagemAtivo = (chatId, texto) => {
    try {
        bot.sendMessage(chatId, texto);
    } catch (e) {
        console.log('Nao conseguiu enviar mensagem para o chat: ' + chatId);
    }
}

atualizar = async () => {

    Order.findAll({
        where: {
            data_pagamento: null
        }
    }).then(orders => {

        orders.forEach(element => {
            verificarPagamento(element);
        });

    }).catch(e => {
        console.log(e);
    });
}

let verificarPagamento = async (element) => {
    let capture = await captureOrder(element);
}


const schedule = require('node-schedule');

const job = schedule.scheduleJob('*/50 * * * * *', function () {
    atualizar();
    //corrigirDados();
});

corrigirDados = async () => {

    let Op = Sequelize.Op;
    let clientes = await Cliente.findAll({});
    let listaClientes = [];
    let cli;
    for (var i = 0; i < clientes.length; i++) {
        cli = clientes[i];
        
        let cliDupli = await Cliente.findAll({
            where: {
                codigo: cli.codigo
                ,id: {[Op.not]:cli.id}
            }
        });
        cliDupli.forEach(clic=>{
            clic.destroy();
        });
        console.log(cli.id + ':' +cli.codigo + 'Tam:'+ cliDupli.length);
    }    
    console.log('--------------------------------------');
    listaClientes.forEach(clicc=>{
    //    console.log(clicc.id + ':' +clicc.codigo);
    });
    console.log(listaClientes.length);

};



port = process.env.PORT || 8888;
http.createServer(function (req, res) {
    res.write('RED BOT'); 
    res.end(); 
  }).listen(port);

