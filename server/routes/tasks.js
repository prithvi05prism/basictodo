const router = require("express").Router();

const { 
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    getTask,
    getAllTasks
} = require("../views/tasks.js");

router.get('/:id', getTask);
router.get('/', getAllTasks);
router.post('/', addTask);
router.patch('/:id', editTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', toggleTask);

module.exports = router;