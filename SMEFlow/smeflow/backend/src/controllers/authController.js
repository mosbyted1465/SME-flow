const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.signup({ name, email, password });

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});

module.exports = { signup, login, getMe };
