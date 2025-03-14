const nodemailer = require("nodemailer");

// Setup email transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: "your-email@gmail.com",
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Email Error:", error);
  }
};

module.exports = sendEmail;
