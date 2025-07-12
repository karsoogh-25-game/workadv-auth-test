const express = require('express');
const path =require('path');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- Sequelize and User Model (Unchanged) ---
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database.db',
    logging: false
});

const User = sequelize.define('User', {
    phoneNumber: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

// --- Your Main App Routes (Unchanged) ---
app.get('/', async (req, res) => {
    const phoneNumber = req.query.name;
    if (!phoneNumber) {
        return res.status(400).send('Bad Request: Phone number is required.');
    }
    const user = await User.findByPk(phoneNumber);
    if (user) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).send('User not found.');
    }
});

app.get('/api/user-data', async (req, res) => {
    const phoneNumber = req.query.phone;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required.' });
    }
    const user = await User.findByPk(phoneNumber);
    if (user) {
        res.json({ name: user.name });
    } else {
        res.status(404).json({ error: 'User not found.' });
    }
});

app.post('/verify', async (req, res) => {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
        return res.status(400).json({ success: false, message: 'Phone number and password are required.' });
    }
    const user = await User.findByPk(phoneNumber);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    res.json({ success: isMatch });
});


// ===================================================================
// ==================== OUR OWN SIMPLE ADMIN PANEL ===================
// ===================================================================

const adminHtmlLayout = (title, body) => `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; background: #f0f2f5; color: #333; }
        .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1, h2 { color: #1d2129; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; border: 1px solid #ddd; text-align: right; }
        th { background-color: #f5f6f7; }
        form { margin-top: 20px; padding: 20px; border: 1px solid #ccd0d5; border-radius: 8px; }
        input { width: calc(100% - 22px); padding: 10px; margin-bottom: 10px; border: 1px solid #ccd0d5; border-radius: 4px; }
        button { background-color: #1877f2; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        button.delete { background-color: #fa3e3e; }
        a { color: #1877f2; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>پنل مدیریت ساده</h1>
        ${body}
    </div>
</body>
</html>
`;

// 1. Show all users + Add form
app.get('/admin/users', async (req, res) => {
    const users = await User.findAll({ order: [['name', 'ASC']] });
    let userRows = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.phoneNumber}</td>
            <td>
                <form action="/admin/users/delete" method="POST" style="display:inline;">
                    <input type="hidden" name="phoneNumber" value="${user.phoneNumber}">
                    <button type="submit" class="delete">حذف</button>
                </form>
            </td>
        </tr>
    `).join('');

    const body = `
        <h2>لیست کاربران</h2>
        <table>
            <tr><th>نام</th><th>شماره تلفن</th><th>عملیات</th></tr>
            ${userRows}
        </table>
        <hr>
        <h2>افزودن کاربر جدید</h2>
        <form action="/admin/users/add" method="POST">
            <label>نام:</label>
            <input type="text" name="name" required>
            <label>شماره تلفن:</label>
            <input type="text" name="phoneNumber" required>
            <label>رمز عبور:</label>
            <input type="password" name="password" required>
            <button type="submit">افزودن کاربر</button>
        </form>
    `;
    res.send(adminHtmlLayout('مدیریت کاربران', body));
});

// 2. Handle Add User
app.post('/admin/users/add', async (req, res) => {
    try {
        const { name, phoneNumber, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, phoneNumber, password: hashedPassword });
    } catch (error) {
        console.error("Error adding user:", error);
    }
    res.redirect('/admin/users');
});

// 3. Handle Delete User
app.post('/admin/users/delete', async (req, res) => {
    try {
        await User.destroy({ where: { phoneNumber: req.body.phoneNumber } });
    } catch (error) {
        console.error("Error deleting user:", error);
    }
    res.redirect('/admin/users');
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Your simple Admin Panel is available at http://localhost:${PORT}/admin/users`);
});