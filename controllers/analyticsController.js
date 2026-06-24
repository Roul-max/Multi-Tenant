const Activity = require("../models/Activity");
const Note = require("../models/Note");
const User = require("../models/User");

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getAnalytics = async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const seriesDates = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      return formatDateKey(date);
    });

    const [totalNotes, teamMembers, activityCount, notesCreatedOverTime] = await Promise.all([
      Note.countDocuments({ tenantId: req.tenant._id }),
      User.countDocuments({ tenantId: req.tenant._id }),
      Activity.countDocuments({ tenantId: req.tenant._id }),
      Note.aggregate([
        {
          $match: {
            tenantId: req.tenant._id,
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const countsByDate = new Map(notesCreatedOverTime.map((item) => [item._id, item.count]));

    return res.success({
      stats: {
        totalNotes,
        teamMembers,
        activityCount,
        plan: req.tenant.plan,
      },
      notesCreatedOverTime: seriesDates.map((date) => ({
        date,
        count: countsByDate.get(date) || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
