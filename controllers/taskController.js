import Task from '../models/Task.js';
import Project from '../models/Project.js';

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Creator only)
export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    if (!title || !project || !assignedTo) {
      return res.status(400).json({ message: 'Title, project, and assignedTo are required' });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) return res.status(404).json({ message: 'Project not found' });

    // Only project creator can create tasks
    if (projectExists.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can create tasks' });
    }

    const isMember = projectExists.teamMembers.some(
      (member) => member.toString() === assignedTo.toString()
    );
    if (!isMember) {
      return res.status(400).json({ message: 'Assigned user must be a member of the project' });
    }

    const task = await Task.create({
      title, description, project, assignedTo, createdBy: req.user._id, status, priority, dueDate
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while creating task' });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const { project, status, assignedTo, overdue } = req.query;

    // Find all projects where user is the creator
    const ownedProjects = await Project.find({ createdBy: req.user._id }).select('_id');
    const ownedProjectIds = ownedProjects.map(p => p._id);

    // User can see tasks assigned to them OR tasks in projects they own
    let query = {
      $or: [
        { assignedTo: req.user._id },
        { project: { $in: ownedProjectIds } }
      ]
    };

    if (project) {
      const p = await Project.findById(project);
      if (!p) return res.status(404).json({ message: 'Project not found' });
      
      const isMember = p.teamMembers.some(m => m.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'Not authorized for this project' });
      
      query.project = project;
    }

    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while fetching tasks' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name createdBy')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isCreator = task.project.createdBy.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo._id.toString() === req.user._id.toString();

    if (!isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while fetching task' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only update your own tasks"
      });
    }

    // Assigned user can only update status
    const { status } = req.body;
    if (status) task.status = status;

    const updatedTask = await task.save();
    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Project Creator only)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can delete tasks' });
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while deleting task' });
  }
};
