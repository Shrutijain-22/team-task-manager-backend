import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Any authenticated user)
export const createProject = async (req, res) => {
  try {
    const { name, description, teamMembers } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    let validTeamMembers = [];
    if (teamMembers && teamMembers.length > 0) {
      const users = await User.find({ _id: { $in: teamMembers } });
      if (users.length !== teamMembers.length) {
        return res.status(400).json({ message: 'One or more invalid user IDs in teamMembers' });
      }
      validTeamMembers = users.map(u => u._id.toString());
    }

    // Auto-include creator in teamMembers
    if (!validTeamMembers.includes(req.user._id.toString())) {
      validTeamMembers.push(req.user._id.toString());
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      teamMembers: validTeamMembers,
    });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while creating project' });
  }
};

// @desc    Get all projects user is a member of
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    // All users fetch projects where they are in the teamMembers array
    const projects = await Project.find({ teamMembers: req.user._id })
      .populate('createdBy', 'name email')
      .populate('teamMembers', 'name email');

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while fetching projects' });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (Checked by checkProjectMember)
export const getProjectById = async (req, res) => {
  try {
    // Project is already fetched by checkProjectMember
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('teamMembers', 'name email');
      
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while fetching project' });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Checked by checkProjectAdmin)
export const updateProject = async (req, res) => {
  try {
    const { name, description, teamMembers } = req.body;
    const project = req.project;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    if (teamMembers) {
      const users = await User.find({ _id: { $in: teamMembers } });
      if (users.length !== teamMembers.length) {
        return res.status(400).json({ message: 'One or more invalid user IDs in teamMembers' });
      }
      let validTeamMembers = users.map(u => u._id.toString());
      if (!validTeamMembers.includes(project.createdBy.toString())) {
        validTeamMembers.push(project.createdBy.toString());
      }
      project.teamMembers = validTeamMembers;
    }

    const updatedProject = await project.save();
    
    res.json({ message: 'Project updated successfully', project: updatedProject });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while updating project' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Checked by checkProjectAdmin)
export const deleteProject = async (req, res) => {
  try {
    await Project.deleteOne({ _id: req.project._id });
    res.json({ message: 'Project removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while deleting project' });
  }
};

// @desc    Add a member to a project
// @route   PUT /api/projects/:id/add-member
// @access  Private (Checked by checkProjectAdmin)
export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = req.project;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMember = project.teamMembers.some((m) => m.toString() === userId.toString());
    if (isMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    project.teamMembers.push(userId);
    const updatedProject = await project.save();

    res.json({ message: 'Member added successfully', project: updatedProject });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while adding member' });
  }
};

// @desc    Remove a member from a project
// @route   PUT /api/projects/:id/remove-member
// @access  Private (Checked by checkProjectAdmin)
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = req.project;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId.toString() === project.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }

    const isMember = project.teamMembers.some((m) => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ message: 'User is not a team member' });
    }

    project.teamMembers = project.teamMembers.filter((m) => m.toString() !== userId.toString());
    const updatedProject = await project.save();

    res.json({ message: 'Member removed successfully', project: updatedProject });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while removing member' });
  }
};
