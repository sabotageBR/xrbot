const database = require('./db');
const Sequelize = require('sequelize');
 
const Order = database.define('orders', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    cliente: {
        type: Sequelize.STRING
        ,allowNull: false
    },
    transacao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    currency_code: {
        type: Sequelize.STRING
        ,allowNull: false
    },
    valor: {
        type: Sequelize.DOUBLE
    },
    status: {
        type: Sequelize.STRING
        ,allowNull: false
    
    },pontos: {
        type: Sequelize.INTEGER
        ,allowNull: false
    },
    data_pagamento: {
        type: Sequelize.DATE
    },
    id_chat:{
        type: Sequelize.STRING
    },
    uid: {
        type: Sequelize.STRING
        ,allowNull: false
    
    }
})
 
module.exports = Order;