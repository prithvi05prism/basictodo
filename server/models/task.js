const { DataTypes } = require('sequelize');
const { postgresClient } = require('../db/postgres');

const Task = postgresClient.define(
    'Task',
    {
        taskID:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        title:{
            type: DataTypes.STRING(1000),
        },

        description:{
            type: DataTypes.STRING(1000),
        },

        status:{
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
        // Status Codes:
        // false: Task Incomplete
        // true: Task Complete
    },

    {
        tableName: "tasks"
    }
);

module.exports = {Task};
