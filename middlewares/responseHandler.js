const attachResponseHelpers = (req, res, next) => {
  res.success = (data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  };

  next();
};

module.exports = { attachResponseHelpers };
