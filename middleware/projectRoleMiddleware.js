import Project from '../models/Project.js';

export const checkProjectAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project creator can perform this action' });
    }
    
    req.project = project; // Pass to controller to save DB call
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking project admin access' });
  }
};

export const checkProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.teamMembers.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized for this project' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking project member access' });
  }
};
