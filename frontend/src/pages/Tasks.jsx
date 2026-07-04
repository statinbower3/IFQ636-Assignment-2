/**
 * @file Tasks.jsx
 * @description Container page that pairs TaskForm (create/edit) with TaskList (display).
 *
 * ⚠️ LEGACY / TEMPLATE PAGE — NOT ROUTED AND NOT PART OF THE ACTIVE APP.
 * This page (and its TaskForm/TaskList children) is leftover scaffolding from
 * the MERN task-manager starter this project was built on. It fetches from
 * `/api/tasks`, an endpoint the backend does not implement, and it is NOT
 * registered in App.js, so it is unreachable in the running app. It is kept for
 * reference only and can be removed. The live pages are CourseList, MyCourses,
 * Profile and AdminPanel.
 *
 * Pattern (were it wired up): the parent owns the `tasks` state and the
 * `editingTask` selection, passing both (and their setters) down so the form and
 * list stay in sync — a standard "lift state up" arrangement.
 */

import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);            // the shared task list
  const [editingTask, setEditingTask] = useState(null); // currently-edited task, or null

  // Load the user's tasks on mount / when the user changes.
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get('/api/tasks', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTasks(response.data);
      } catch (error) {
        alert('Failed to fetch tasks.');
      }
    };

    fetchTasks();
  }, [user]);

  return (
    <div className="container mx-auto p-6">
      {/* Form and list share the same state via props (state lifted to this parent). */}
      <TaskForm
        tasks={tasks}
        setTasks={setTasks}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
      />
      <TaskList tasks={tasks} setTasks={setTasks} setEditingTask={setEditingTask} />
    </div>
  );
};

export default Tasks;
