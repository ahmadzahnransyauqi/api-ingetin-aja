const validateNote = (req, res, next) => {
  const { title, text } = req.body;

  if (!title && !text) {
    return res.status(400).json({
      status: "error",
      message: "Title or text is required",
    });
  }

  // Validate reminder if exists
  if (req.body.reminder) {
    const { date, time } = req.body.reminder;

    if (date && time) {
      const dateTimeString = `${date}T${time}`;
      const reminderDate = new Date(dateTimeString);

      if (isNaN(reminderDate.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid reminder date/time format",
        });
      }

      // Check if reminder is in the past
      if (reminderDate.getTime() < Date.now()) {
        return res.status(400).json({
          status: "error",
          message: "Reminder cannot be in the past",
        });
      }
    }
  }

  next();
};

const validateUser = (req, res, next) => {
  const { username, email, password } = req.body;

  // Registration validation
  if (req.path === "/register") {
    if (!username || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }
  }

  // Login validation
  if (req.path === "/login") {
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required",
      });
    }
  }

  next();
};

module.exports = {
  validateNote,
  validateUser,
};
