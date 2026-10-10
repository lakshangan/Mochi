import React, { useState } from 'react';
import { TaskItem } from '../../shared/types';
import { CheckSquare, Square, Trash2, Plus, Sparkles, Filter } from 'lucide-react';

interface TaskPanelProps {
  tasks: TaskItem[];
  onAddTask: (title: string, priority?: 'low' | 'medium' | 'high') => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), priority);
    setNewTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="panel-container">
      {/* Create Task Form */}
      <form onSubmit={handleSubmit} className="task-input-bar">
        <input
          type="text"
          placeholder="What are you working on today?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="task-text-input"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="priority-selector"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="btn btn-primary btn-icon" title="Add Task">
          <Plus size={18} />
        </button>
      </form>

      {/* Filter and stats row */}
      <div className="task-toolbar">
        <div className="filter-chips">
          <button
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button
            className={`chip ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({tasks.length - completedCount})
          </button>
          <button
            className={`chip ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Done ({completedCount})
          </button>
        </div>

        {completedCount > 0 && (
          <button className="btn-text-danger" onClick={onClearCompleted}>
            Clear Done
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="task-list-scroll">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={28} className="empty-icon text-cyan" />
            <div className="empty-title">
              {filter === 'completed' ? 'No completed tasks yet' : 'All clear for now!'}
            </div>
            <div className="empty-subtitle">
              Add a task above or tell Mochi: "Add a task to..."
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className={`task-row ${task.completed ? 'completed' : ''}`}>
              <button
                className="task-check-btn"
                onClick={() => onToggleTask(task.id)}
                title={task.completed ? 'Mark incomplete' : 'Complete task'}
              >
                {task.completed ? (
                  <CheckSquare size={18} className="check-icon checked" />
                ) : (
                  <Square size={18} className="check-icon" />
                )}
              </button>

              <div className="task-title-wrap">
                <span className="task-title-text">{task.title}</span>
                <span className={`priority-tag priority-${task.priority}`}>{task.priority}</span>
              </div>

              <button
                className="task-delete-btn"
                onClick={() => onDeleteTask(task.id)}
                title="Delete task"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
