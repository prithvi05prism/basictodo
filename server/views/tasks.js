const { postgresClient } = require("../db/postgres");
const { Op, Model } = require("sequelize");
const {Task} = require('../models/task');

const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            attributes: ['taskID', 'title', 'description', 'status']
        });
        return res.status(200).json(tasks);
    }catch(error){
        console.log("[getAllTasks Route] There was an error: ", error);
        return res.status(500).json({
            status: "failure",
            message: "An error occured while fetching tasks"
        });
    }
}

const addTask = async (req, res) => {
    try {
        const title = req.body.title;
        const description = req.body.description;
        const task = await Task.create({
            title: title,
            description: description
        });
        console.log("[addTask Route] New task created: ", task);
        return res.status(200).json({
            status: "success", 
            message: "task created succesfully", 
            task
        });
    }catch(err){
        console.log("[addTask Route] There was an error: ", err);
        return res.status(400).json({
            status: "failure",
            message: "An error occured while adding task"
        })
    }
}

const getTask = async (req, res) => {
    try {
        const id = req.params.id;
        const task = await Task.findByPk(id, {
            attributes: ['taskID', 'title', 'description', 'status']
        });
        if(!task){
            return res.status(404).json({
                status: "failure", 
                message: "task not found"
            });
        }
        return res.status(200).json(task);
    }catch(err){
        console.log("[getTask Route] There was an error: ", err);
        return res.status(400).json({
            status: "failure",
            message: "An error occured while fetching task"
        })
    }
}

const editTask = async (req, res) => {
    try {
        const id = req.params.id;
        const title = req.body.title;
        const description = req.body.description;

        const task = await Task.findByPk(id);
        if(!task){
            return res.status(500).json({status: "failure", message: "task not found"})
        }
        task.title = (!title)?task.title:title;
        task.description = (!description)?task.description:description;

        await task.save();
        await task.reload();

        return res.status(200).json({
            status: "success", 
            message: "task edited successfully", 
            task
        });
    }catch(err){
        console.log("[editTask Route] There was an error: ", err);
        return res.status(400).json({
            status: "failure",
            message: "An error occured while editing task"
        })
    }
}

const toggleTask = async (req, res) => {
    try {
        const id = req.params.id;
        const task = await Task.findByPk(id);
        if(!task){
            return res.status(500).json({status: "failure", message: "task not found"})
        }
        task.status = !task.status;

        await task.save();
        await task.reload();

        return res.status(200).json({
            status: "success",
            message: "task status toggled",
            task
        })
    }catch(err){
        console.log("[completeTask Route] There was an error: ", err);
        return res.status(400).json({
            status: "failure",
            message: "An error occured while editing task"
        })
    }
}

const deleteTask = async (req, res) => {
    try {
        const id = req.params.id;
        const task = await Task.findByPk(id);

        if(task){
            await Task.destroy({where: {taskID: id}});
            console.log("[deleteTask Route] Deleted Successfully Task with ID: ", id);
            return res.status(200).json({
                status: "success",
                message: "task deleted"
            })
        } else {
            console.log("[deleteTask Route] The task doesn't exist");
            return res.status(400).json({
                status: "failure",
                message: "task doesn't exist"
            })
        }
    }catch(err){
        console.log("[deleteTask Route] There was an error: ", err);
        return res.status(400).json({
            status: "failure",
            message: "An error occured while deleting task"
        })
    }
}

module.exports = { 
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    getTask,
    getAllTasks
};
