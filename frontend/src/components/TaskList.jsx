/**
 * @file TaskList.jsx
 * @description Renders a list of "task" cards, each with Edit and Delete actions.
 *
 * ⚠️ LEGACY / TEMPLATE COMPONENT — NOT PART OF THE ACTIVE COURSE APP.
 * Like TaskForm.jsx, this is leftover scaffolding from the MERN task-manager
 * starter. It calls `/api/tasks`, which this backend does not implement, and is
 * only referenced by the un-routed pages/Tasks.jsx. Retained for reference; the
 * live equivalents are the course/enrolment cards in CourseList.jsx, MyCourses.jsx
 * and the course table in AdminPanel.jsx.
 *
 * @param {Object}   props
 * @param {Object[]} props.tasks          - Tasks to display.
 * @param {Function} props.setTasks       - Setter used to remove a task after deletion.
 * @param {Function} props.setEditingTask - Puts a task into the parent's edit mode.
 */

import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const TaskList = ({ tasks, setTasks, setEditingTask }) => {
  const { user } = useAuth(); // token for the authorised DELETE request

  /**
   * Deletes a task by id, then removes it from the parent's list optimistically
   * (only after the request succeeds).
   * @param {string} taskId
   */
  const handleDelete = async (taskId) => {
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      // Drop the deleted task from the list.
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (error) {
      alert('Failed to delete task.');
    }
  };

  return (
    <div>
      {/* Render one card per task. `key` uses the Mongo _id for stable reconciliation. */}
      {tasks.map((task) => (
        <div key={task._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
          <h2 className="font-bold">{task.title}</h2>
          <p>{task.description}</p>
          <p className="text-sm text-gray-500">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
          <div className="mt-2">
            {/* Edit: hand this task up to the parent to populate TaskForm. */}
            <button
              onClick={() => setEditingTask(task)}
              className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
            {/* Delete: remove from server + list. */}
            <button
              onClick={() => handleDelete(task._id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
