/**
 * @file TaskForm.jsx
 * @description Create/edit form for a "task" entity.
 *
 * ⚠️ LEGACY / TEMPLATE COMPONENT — NOT PART OF THE ACTIVE COURSE APP.
 * This project was scaffolded from a MERN task-manager starter. TaskForm,
 * TaskList and pages/Tasks.jsx are leftovers from that starter: they call an
 * `/api/tasks` endpoint that this backend does NOT implement (the backend only
 * exposes /api/auth, /api/courses and /api/enrollments), and Tasks.jsx is not
 * wired into any route in App.js. They are retained for reference/history and
 * can be safely deleted. The equivalent "live" CRUD form for this app is the
 * course form inside pages/AdminPanel.jsx.
 *
 * Behaviour (were the /api/tasks API present):
 *   - Edit mode  : when `editingTask` is set, the form pre-fills and a PUT updates it.
 *   - Create mode: otherwise a POST creates a new task.
 *   - On success the parent's `tasks` list is updated via `setTasks`.
 *
 * @param {Object}   props
 * @param {Object[]} props.tasks          - Current task list (owned by the parent page).
 * @param {Function} props.setTasks       - Setter to update the parent's task list.
 * @param {Object|null} props.editingTask - Task being edited, or null for create mode.
 * @param {Function} props.setEditingTask - Setter to enter/exit edit mode.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const TaskForm = ({ tasks, setTasks, editingTask, setEditingTask }) => {
  const { user } = useAuth(); // needed for the Bearer token on write requests
  // Local controlled-form state for the three fields.
  const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });

  // Sync the form whenever the editing target changes:
  // pre-fill in edit mode, reset to blank in create mode.
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description,
        deadline: editingTask.deadline,
      });
    } else {
      setFormData({ title: '', description: '', deadline: '' });
    }
  }, [editingTask]);

  /**
   * Submits the form — PUT when editing an existing task, POST when creating one.
   * Updates the parent's task list in place on success.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser's default full-page form submit
    try {
      if (editingTask) {
        // UPDATE: replace the matching task in the list with the server's response.
        const response = await axiosInstance.put(`/api/tasks/${editingTask._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTasks(tasks.map((task) => (task._id === response.data._id ? response.data : task)));
      } else {
        // CREATE: append the newly created task.
        const response = await axiosInstance.post('/api/tasks', formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTasks([...tasks, response.data]);
      }
      // Reset form + leave edit mode.
      setEditingTask(null);
      setFormData({ title: '', description: '', deadline: '' });
    } catch (error) {
      alert('Failed to save task.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded mb-6">
      <h1 className="text-2xl font-bold mb-4">{editingTask ? 'Your Form Name: Edit Operation' : 'Your Form Name: Create Operation'}</h1>
      {/* Each input is controlled: value comes from state, onChange writes back to it. */}
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="date"
        value={formData.deadline}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        {editingTask ? 'Update Button' : 'Create Button'}
      </button>
    </form>
  );
};

export default TaskForm;
