require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    timezone: "+07:00",
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + "_test", // atau bisa hardcode 'blog_db_test'
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    timezone: "+07:00",
    logging: false, // disable SQL logging saat testing
  },
};
