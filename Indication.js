const database = require('./db');
const Sequelize = require('sequelize');
 
const Indication = database.define('indications', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    cliente_origem: {
        type: Sequelize.STRING
        ,allowNull: false
    },
    cliente_destino: {
        type: Sequelize.STRING
        ,allowNull: false
    },
    
    pontos:{
        type: Sequelize.INTEGER
    }
})
 
module.exports = Indication;