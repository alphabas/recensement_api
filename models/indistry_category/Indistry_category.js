const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../utils/sequerize');


const Indistry_category = sequelize.define('indistry_category', {

    id_indistry_category  : {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name_indistry_category:{
        type: DataTypes.STRING(150),
        allowNull: false
    },

   
}, {
    freezeTableName: true,
    tableName: 'indistry_category',
    timestamps: false
})



module.exports = Indistry_category

