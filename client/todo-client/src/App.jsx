import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Create axios instance with base URL to reduce duplication
const api = axios.create({
  baseURL: 'http://localhost:8000/task'
});

// Axios API Calls - using the configured instance
const todoAPI = {
  // Get all tasks
  async getAll() {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  },
  
  // Create a new todo
  async create(todo) {
    try {
      const response = await api.post('/', todo);
      return response.data;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },
  
  // Update a todo
  async update(id, updates) {
    try {
      const response = await api.patch(`/${id}`, updates);
      return response.data.task;
    } catch (error) {
      console.error(`Error updating todo ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a todo
  async delete(id) {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting todo ${id}:`, error);
      throw error;
    }
  },
  
  // Toggle complete status
  async toggleComplete(id) {
    try {
      const response = await api.patch(`/${id}/complete`);
      return response.data.task;
    } catch (error) {
      console.error(`Error toggling todo ${id} completion:`, error);
      throw error;
    }
  }
};

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch todos only on component mount
  const fetchTodos = useCallback(async () => {
    // Skip API call if it's not the initial load
    if (!isInitialLoad) return;
    
    try {
      setIsLoading(true);
      const data = await todoAPI.getAll();
      // Ensure each todo has a valid id
      const validTodos = data.filter(todo => todo && todo.taskID);
      setTodos(validTodos);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks. Please try again later.');
      console.error('Error fetching todos:', err);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [isInitialLoad]);

  // Only fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async () => {
    if (input.trim() !== '') {
      try {
        const newTodo = {
          title: input,
          description: description || 'No description provided.'
        };
        
        setIsLoading(true);
        const savedTodo = await todoAPI.create(newTodo);
        
        // Verify the returned todo has an ID before adding to state
        if (savedTodo.task && savedTodo.task.taskID) {
          // Update local state directly rather than refetching all todos
          setTodos(prevTodos => [...prevTodos, savedTodo.task]);
          setInput('');
          setDescription('');
        } else {
          setError('Server returned invalid task data. Please try again.');
          console.error('Invalid todo returned from server:', savedTodo);
        }
      } catch (err) {
        setError('Failed to add task. Please try again.');
        console.error('Error adding todo:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteTodo = async (id) => {
    try {
      setIsLoading(true);
      await todoAPI.delete(id);
      
      // Update local state without refetching
      setTodos(prevTodos => prevTodos.filter(todo => todo.taskID !== id));
      
      if (selectedTodo && selectedTodo.taskID === id) {
        setSelectedTodo(null);
      }
      
      if (editId === id) {
        cancelEdit();
      }
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting todo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (id, e) => {
    e.stopPropagation();
    try {
      const todoToUpdate = todos.find(todo => todo.taskID === id);
      if (!todoToUpdate) return;
      
      setIsLoading(true);
      const updatedTodo = await todoAPI.toggleComplete(id);
      
      // Update local state without refetching
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.taskID === id ? updatedTodo : todo
      ));
      
      // Update selectedTodo if it's the one being completed
      if (selectedTodo && selectedTodo.taskID === id) {
        setSelectedTodo(updatedTodo);
      }
    } catch (err) {
      setError('Failed to update task status. Please try again.');
      console.error('Error toggling completion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (todo, e) => {
    e.stopPropagation();
    setSelectedTodo(todo);
    setEditMode(true);
    setEditId(todo.taskID);
    setEditText(todo.title);
    setEditDescription(todo.description);
  };

  const saveEdit = async () => {
    if (editText.trim() !== '') {
      try {
        setIsLoading(true);
        const updates = {
          title: editText,
          description: editDescription
        };
        
        const updatedTodo = await todoAPI.update(editId, updates);
        
        // Update local state without refetching
        setTodos(prevTodos => prevTodos.map(todo => 
          todo.taskID === editId ? updatedTodo : todo
        ));
        
        // Update selectedTodo if it's the one being edited
        if (selectedTodo && selectedTodo.taskID === editId) {
          setSelectedTodo(updatedTodo);
        }
        
        cancelEdit();
      } catch (err) {
        setError('Failed to update task. Please try again.');
        console.error('Error saving edit:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    setEditText('');
    setEditDescription('');
  };

  // Handle key press event
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTodo();
    }
  };

  // Handle key press in edit mode
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Select a todo to view description - memoize this function to prevent unnecessary re-renders
  const selectTodo = useCallback((todo) => {
    if (editMode && editId !== todo.taskID) return; // Don't change selection if editing a different todo
    setSelectedTodo(prevSelected => 
      prevSelected && prevSelected.taskID === todo.taskID ? null : todo
    );
  }, [editMode, editId]);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="todo-app">
        <div className="header">
          <h1>Todo List App</h1>
          <button 
            className="toggle-btn" 
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              className="todo-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new task..."
              disabled={isLoading}
            />
            <textarea
              className="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows="2"
              disabled={isLoading}
            />
          </div>
          <button 
            className={`add-btn ${isLoading ? 'loading' : ''}`} 
            onClick={addTodo}
            disabled={isLoading || input.trim() === ''}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="todo-container">
          {isLoading && todos.length === 0 ? (
            <div className="loading-indicator">Loading tasks...</div>
          ) : todos.length === 0 ? (
            <div className="empty-state">No tasks yet. Add one above!</div>
          ) : (
            <div className="todo-list">
              <AnimatePresence mode="wait">
                {todos.map((todo) => (
                  todo && todo.taskID ? (
                    <motion.div
                      key={todo.taskID}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                      className={`todo-item ${selectedTodo && selectedTodo.taskID === todo.taskID ? 'selected' : ''} ${todo.status ? 'completed' : ''}`}
                      onClick={() => selectTodo(todo)}
                    >
                      <span className={todo.status ? 'completed-text' : ''}>
                        {todo.title}
                      </span>
                      
                      <div className="todo-actions">
                        <button 
                          className="action-btn complete-btn" 
                          onClick={(e) => toggleComplete(todo.taskID, e)}
                          title={todo.status ? 'Mark as incomplete' : 'Mark as complete'}
                          disabled={isLoading}
                        >
                          {todo.status ? '↩️' : '✅'}
                        </button>
                        
                        <button 
                          className="action-btn edit-btn" 
                          onClick={(e) => startEdit(todo, e)}
                          title="Edit"
                          disabled={isLoading || (editMode && editId !== todo.taskID)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTodo(todo.taskID);
                          }}
                          title="Delete"
                          disabled={isLoading}
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  ) : null
                ))}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence mode="wait">
            {selectedTodo && (
              <motion.div 
                className="description-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                key={`desc-${selectedTodo.taskID}`}
                layout
              >
                {editMode && editId === selectedTodo.taskID ? (
                  // Edit form in description box
                  <div className="edit-form">
                    <h3>Edit Task</h3>
                    <input
                      type="text"
                      className="edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      placeholder="Task title"
                      autoFocus
                      disabled={isLoading}
                    />
                    <textarea
                      className="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Task description"
                      rows="3"
                      disabled={isLoading}
                    />
                    <div className="edit-actions">
                      <button 
                        className="action-btn save-btn" 
                        onClick={saveEdit}
                        disabled={isLoading || !editText.trim()}
                      >
                        Save Changes
                      </button>
                      <button 
                        className="action-btn cancel-btn" 
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal view mode
                  <>
                    <h3 className={selectedTodo.status ? 'completed-text' : ''}>
                      {selectedTodo.title}
                    </h3>
                    <p className={selectedTodo.status ? 'completed-text' : ''}>
                      {selectedTodo.description}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;