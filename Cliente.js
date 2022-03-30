const database = require('./db');
const Sequelize = require('sequelize');
 
const Cliente = database.define('clientes', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    codigo: {
        type: Sequelize.STRING,
        allowNull: false
        ,unique: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pontos: {
        type: Sequelize.INTEGER
    },
    chatId: {
        type: Sequelize.STRING
    },
})
 
module.exports = Cliente;