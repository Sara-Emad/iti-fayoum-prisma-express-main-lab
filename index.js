const express = require('express');
require('dotenv').config();
const morgan = require('morgan');
const app = express();
const port = process.env.PORT || 4000;
const userRoutes = require('./routes/user.routes');
const todosRoutes = require('./routes/todo.routes');
const postsRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const prisma = require('./lib/prisma');

// استخدام المكتبات المساعدة
app.use(morgan('combined'));
app.use(express.json());

// تسجيل المسارات
app.use('/users', userRoutes);
app.use('/todos', todosRoutes);
app.use('/posts', postsRoutes);
app.use('/posts', commentRoutes); // إضافة مسارات التعليقات

// معالج الأخطاء العام
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).send({
        statusCode: err.statusCode || 500,
        message: err.message || 'Something went wrong',
        errors: err.errors || []
    });
});

// تشغيل الخادم
async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to database');
        app.listen(port, () => {
            console.log(`Blog API listening on port ${port}`);
        });
    } catch (err) {
        console.error('Error connecting to database', err);
        process.exit(1);
    }
}

main();