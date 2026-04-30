import Project from '../models/Project.js';

export const projectAccessMiddleware = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    // Attach project to req to avoid fetching it again in the controller where possible
    req.project = project;
    next();
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error in project access check' });
  }
};
