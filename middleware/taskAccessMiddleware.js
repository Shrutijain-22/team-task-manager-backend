import Task from '../models/Task.js';

export const taskAccessMiddleware = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAssigned = task.assignedTo.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    req.task = task;
    next();
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Server error in task access check' });
  }
};
