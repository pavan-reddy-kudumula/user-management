const {
  bulkCreateUsersService,
  bulkUpdateUsersService,
  getUsersService,
  getUserByIdService,
  getUserByEmailService,
  getUserByPhoneService,
} = require('../services/userService');

async function bulkCreateUsers(req, res, next) {
  try {
    const result = await bulkCreateUsersService(req.body);
    const statusCode = result.failedCount > 0 ? 207 : 201;

    res.status(statusCode).json({
      success: true,
      message: result.failedCount > 0 ? 'Bulk create completed with partial failures' : 'Users created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function bulkUpdateUsers(req, res, next) {
  try {
    const result = await bulkUpdateUsersService(req.body);
    const statusCode = result.failedCount > 0 ? 207 : 200;

    res.status(statusCode).json({
      success: true,
      message: result.failedCount > 0 ? 'Bulk update completed with partial failures' : 'Users updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await getUsersService(page, limit);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserByEmail(req, res, next) {
  try {
    const { email } = req.params;
    const user = await getUserByEmailService(email);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function getUserByPhone(req, res, next) {
  try {
    const { phone } = req.params;
    const user = await getUserByPhoneService(phone);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bulkCreateUsers,
  bulkUpdateUsers,
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByPhone,
};