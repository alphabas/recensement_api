const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../utils/sequerize');


const Census_block = sequelize.define('census_block', {

    id_census : {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name_census:{
        type: DataTypes.STRING(50),
        allowNull: false
    },

    population_density:{
        type: DataTypes.FLOAT,
        allowNull: false
    },
}, {
    freezeTableName: true,
    tableName: 'census_block',
    timestamps: false
})

module.exports = Census_block

