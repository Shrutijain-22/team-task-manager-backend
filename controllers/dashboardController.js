import Task from '../models/Task.js';
import Project from '../models/Project.js';

// @desc    Get dashboard analytics
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    
    // 1. Personal Stats (Tasks assigned to me)
    const personalTasksQuery = { assignedTo: userId };
    const myTotalTasks = await Task.countDocuments(personalTasksQuery);
    const myCompletedTasks = await Task.countDocuments({ ...personalTasksQuery, status: 'done' });
    const myPendingTasks = await Task.countDocuments({ ...personalTasksQuery, status: { $in: ['todo', 'in-progress', 'in-review'] } });
    const myOverdueTasks = await Task.countDocuments({ 
      ...personalTasksQuery,
      dueDate: { $lt: today }, 
      status: { $ne: 'done' } 
    });

    const myTodoCount = await Task.countDocuments({ ...personalTasksQuery, status: 'todo' });
    const myInProgressCount = await Task.countDocuments({ ...personalTasksQuery, status: 'in-progress' });
    const myInReviewCount = await Task.countDocuments({ ...personalTasksQuery, status: 'in-review' });

    const myStats = {
      totalTasks: myTotalTasks,
      completedTasks: myCompletedTasks,
      pendingTasks: myPendingTasks,
      overdueTasks: myOverdueTasks,
      tasksByStatus: {
        todo: myTodoCount,
        inProgress: myInProgressCount,
        inReview: myInReviewCount,
        done: myCompletedTasks
      }
    };

    // 2. Admin Stats (Tasks for projects I created)
    const myOwnedProjects = await Project.find({ createdBy: userId }).select('_id');
    const myOwnedProjectIds = myOwnedProjects.map(p => p._id);
    
    let adminStats = null;
    
    if (myOwnedProjectIds.length > 0) {
      const adminTasksQuery = { project: { $in: myOwnedProjectIds } };
      
      const adminTotalTasks = await Task.countDocuments(adminTasksQuery);
      const adminCompletedTasks = await Task.countDocuments({ ...adminTasksQuery, status: 'done' });
      const adminPendingTasks = await Task.countDocuments({ ...adminTasksQuery, status: { $in: ['todo', 'in-progress', 'in-review'] } });
      const adminOverdueTasks = await Task.countDocuments({ 
        ...adminTasksQuery,
        dueDate: { $lt: today }, 
        status: { $ne: 'done' } 
      });

      const adminTodoCount = await Task.countDocuments({ ...adminTasksQuery, status: 'todo' });
      const adminInProgressCount = await Task.countDocuments({ ...adminTasksQuery, status: 'in-progress' });
      const adminInReviewCount = await Task.countDocuments({ ...adminTasksQuery, status: 'in-review' });

      const tasksPerUser = await Task.aggregate([
        { $match: adminTasksQuery },
        {
          $group: {
            _id: '$assignedTo',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            count: 1
          }
        }
      ]);

      adminStats = {
        totalProjects: myOwnedProjectIds.length,
        totalTasks: adminTotalTasks,
        completedTasks: adminCompletedTasks,
        pendingTasks: adminPendingTasks,
        overdueTasks: adminOverdueTasks,
        tasksByStatus: {
          todo: adminTodoCount,
          inProgress: adminInProgressCount,
          inReview: adminInReviewCount,
          done: adminCompletedTasks
        },
        tasksPerUser
      };
    }

    return res.json({ myStats, adminStats });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error while fetching dashboard data' });
  }
};
