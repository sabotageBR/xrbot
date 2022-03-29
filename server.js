/** Imports */

// const YTDlpWrap = require('yt-dlp-wrap').default;
// const ytDlpWrap = new YTDlpWrap('/usr/local/bin/yt-dlp');



var shortid = require('shortid');

var http = require('http');

const { Curl } = require('node-libcurl');

var exec = require('child_process').exec;

const TelegramBot = require('node-telegram-bot-api');
const token = '5256485733:AAEKTjfqE6DEgb8IB6Lhspb6UT3bYCkccuo';

const i18n = require('./i18n.js');

const Cliente = require('./Cliente');
const Order = require('./Order');

const Indication = require('./Indication');

const database = require('./db');

const { create } = require('domain');

const { Table } = require('console-table-printer');


// let publicKeyML = 'TEST-9a65716f-a1fa-4a23-8152-eac77271bcae';
// let accessToken = 'TEST-4788801943068672-032721-c9e6cbd022064bda1cf9c41260deaf94-1096864621';

let publicKeyML = 'APP_USR-b4a9f9a4-65a7-43fa-9ec7-d0602649d2a5';
let accessToken = 'APP_USR-4788801943068672-032721-91c00f28ae8c5d6e498ca558961c1f62-1096864621';

var mercadopago = require('mercadopago');

var lang = 'en-us';

const minExpired = 30;

(async () => {
    try {
        const resultado = await database.sync();

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
                    cliente.pontos = cliente.pontos + 20;
                    cliente.save();
                    Indication.create({
                        cliente_origem: cliente.codigo,
                        cliente_destino: msg.from.id,
                        pontos: 30
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

    const chatId = msg.chat.id;

    let cliente = await getCliente(msg);
    if (msg.text.includes('http')) {
        if (msg.text.includes('xvideos')) {
            console.log(new Date()+': '+msg.text);
            if (cliente.pontos > 0) {
                bot.sendMessage(msg.chat.id, i18n.getString('label.global.waitextractvideo', lang));
                executar(msg, cliente, bot);
            } else {
                bot.sendMessage(msg.chat.id, i18n.getString('label.global.insufficientpoints', lang));
            }
        }
        else {
            console.log('Video errado:'+msg.text);
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.errorvideoformat', lang));
        }

    } else {
        console.log('CHAT: '+msg.text);
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

        let hello = i18n.getString('label.global.hi', lang) + ', ' + cliente.nome + '\n' +
            i18n.getString('label.global.pasteurl', lang);
        bot.sendMessage(chatId, hello, opts);
    }

});

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;

    let cliente = await getClienteChat(msg);

    let text = 'Qualquer coisa';

    if (action === 'mypoints') {
        text = i18n.getString('label.global.points', lang) + ': ' + cliente.pontos;
        bot.sendMessage(msg.chat.id, text);
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

        let hello = i18n.getString('label.global.howmanypointsbuy', lang);
        bot.sendMessage(msg.chat.id, hello, opts);

    } else if (action === '1dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy1dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '5.00', cliente.codigo, 15, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));
   
    } else if (action === '5dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy5dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '25.00', cliente.codigo, 55, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));
    
    } else if (action === '10dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy10dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '50.00', cliente.codigo, 120, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));
   
    } else if (action === '20dolar') {
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuy20dolar', lang));
        let uid = await gerarCobrancaMercadoPago('BRL', '100.00', cliente.codigo, 250, msg.chat.id);
        bot.sendMessage(msg.chat.id, 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=' + uid);
        bot.sendMessage(msg.chat.id, i18n.getString('label.global.messagebuyafter', lang));

    } else if (action === 'indication') {

        bot.sendMessage(msg.chat.id, i18n.getString('label.global.textindication0', lang) + cliente.codigo);
        let text = i18n.getString('label.global.textindication1', lang) + "\n\n";
        text += i18n.getString('label.global.textindication2', lang) + "\n";
        bot.sendMessage(msg.chat.id, text);
    }


});


async function executar(msg, cliente, bot) {

    
        const curl = new Curl();
        curl.setOpt('URL', msg.text);
        curl.setOpt('FOLLOWLOCATION', true);
        curl.setOpt(Curl.option.COOKIEFILE, './cookies.txt');
        curl.setOpt(Curl.option.HTTPHEADER, ['User-Agent: Mozilla/5.0', 'Content-Type: application/x-www-form-urlencoded']);
        curl.setOpt(Curl.option.VERBOSE, false);

        curl.on('end', function (statusCode, data, headers) {

            let videoOnline;
            let videoHigh;
            let thumb;
            let name;
            let title;

            data.split(/\r?\n/).forEach(function (line) {

                if (line.includes('html5player.setVideoTitle(')) {
                    title = line.substring(line.indexOf('VideoTitle(') + 12, line.length - 3);

                } else if (line.includes('html5player.setVideoHLS(')) {
                    videoOnline = line.substring(line.indexOf('HLS(') + 5, line.length - 3);

                } else if (line.includes('html5player.setVideoUrlHigh(')) {
                    videoHigh = line.substring(line.indexOf('High(') + 6, line.length - 3);

                } else if (line.includes('html5player.setThumbUrl(')) {
                    thumb = line.substring(line.indexOf('ThumbUrl(') + 10, line.length - 3);
                }

            });


            bot.sendMessage(msg.chat.id, i18n.getString('label.global.linkassistironline', lang) + '\n' + videoOnline);
            bot.sendMessage(msg.chat.id, i18n.getString('label.global.linkparadownload', lang) + '\n' + videoHigh);
            if(videoOnline && videoHigh){
                descontarPonto(cliente);
            }
            
            this.close();
        });

        curl.on('error', function (error, errorCode) {
            // faça algo com error
            this.close()
        });
        curl.perform();


}

async function descontarPonto(cliente) {
    cliente.pontos = cliente.pontos - 1;
    cliente.save();
}

async function getCliente(msg) {

    return Cliente.findAll({
        where: {
            codigo: msg.from.id
        }
    }).then(clientes => {
        let cliente;
        if (clientes.length === 0) {
            cliente = Cliente.create({
                codigo: msg.from.id,
                nome: msg.from.first_name + ' ' + msg.from.last_name,
                pontos: 30
            });
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
            cliente = Cliente.create({
                codigo: msg.chat.id,
                nome: msg.chat.first_name + ' ' + msg.chat.last_name,
                pontos: 30
            });
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

//AQUI
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

    
    if (parseInt(Math.abs(element.createdAt.getTime() - new Date().getTime()) / (1000 * 60) % 60) < minExpired) {
        mercadopago.configure({
            access_token: accessToken
        });
       
        var filters = {
            range: 'date_created',
            begin_date: 'NOW-1MONTH',
            end_date: 'NOW',
            status: 'approved',
            operation_type: 'regular_payment'
          };

        req = await mercadopago.payment.search({qs: filters}).catch(function (error) {console.log(error)});
        req.body.results.forEach(async (pagamento) =>{
            if(element.uid === pagamento.description){

             element.status = 'APPROVED';
             element.data_pagamento = new Date();
             element.save();

            let clienteEspera = await getClienteByCodigo(element.cliente);
            clienteEspera.pontos = clienteEspera.pontos + element.pontos;
            clienteEspera.save();

            enviarMensagemAtivo(element.id_chat, i18n.getString('label.global.messagebuycongratulation', lang));
            enviarMensagemAtivo(element.id_chat, i18n.getString('label.global.messagebuypointscongratulation', lang) + ' ' + element.pontos + ' ' + i18n.getString('label.global.points', lang));

            }
        });

    } else {
        // element.status = 'EXPIRED';
        // element.data_pagamento = new Date();
        // element.save();
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
});

const administrador = schedule.scheduleJob('*/30 * * * * *', function () {
    admin();
});


admin = async () => {

    //Create a table
    const p = new Table();

    let ordersOpened = await Order.count({
        where: {
            data_pagamento: null
        }
    });

    let ordersPay = await Order.count({
        where: {
            status: 'APPROVED'
        }
    });

    let ordersExpired = await Order.count({
        where: {
            status: 'EXPIRED'
        }
    });

    let indications = await Indication.count({});

    let pointsActive = await Cliente.sum('pontos', {});


    let sumOrdersPay = await Order.sum('valor', { where: { status: 'APPROVED' } });

    let clientes = await Cliente.count({});



    //add rows with color
    p.addRow({ cliente: 'Clientes Cadastrados', value: clientes });

    p.addRow({ cliente: 'Pagamentos em Aberto', value: ordersOpened });

    p.addRow({ cliente: 'Pagamentos Efetuados', value: ordersPay });

    p.addRow({ cliente: 'Pontos Ativos', value: pointsActive });

    p.addRow({ cliente: 'Indicações', value: indications });

    p.addRow({ cliente: 'Pagamentos Expirados', value: ordersExpired }, { color: 'red' });

    p.addRow({ cliente: 'Valor Total Recebido: ', value: sumOrdersPay }, { color: 'green' });



    //print
    p.printTable();
}
port = process.env.PORT || 8888;
http.createServer(function (req, res) {
    res.write('RED BOT'); 
    res.end(); 
  }).listen(port);

