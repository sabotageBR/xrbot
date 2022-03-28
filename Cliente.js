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
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pontos: {
        type: Sequelize.INTEGER
    }
})
 
module.exports = Cliente;