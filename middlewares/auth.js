const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// التحقق من صحة المستخدم
exports.verifyUser = async (req, res, next) => {
    try {
        // استخراج التوكن من الـ headers
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new AppError('Authentication token is missing', 401));
        }

        // التحقق من صحة التوكن
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        // البحث عن المستخدم في قاعدة البيانات
        const user = await prisma.user.findUnique({ 
            where: { email: payload.email } 
        });

        if (!user) {
            return next(new AppError('User not found', 401));
        }

        // إضافة المستخدم إلى الطلب
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired', 401));
        }
        next(new AppError('Authentication failed', 401, error));
    }
};

// وظيفة للتحقق من صلاحيات محددة
exports.checkPermission = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const resourceId = req.params.id;
            
            let resource;
            
            switch (resourceType) {
                case 'post':
                    resource = await prisma.post.findUnique({ 
                        where: { id: Number(resourceId) } 
                    });
                    break;
                case 'comment':
                    resource = await prisma.comment.findUnique({ 
                        where: { id: Number(resourceId) } 
                    });
                    break;
                default:
                    return next(new AppError('Invalid resource type', 400));
            }
            
            if (!resource) {
                return next(new AppError(`${resourceType} not found`, 404));
            }
            
            if (resource.authorId !== userId) {
                return next(new AppError('Unauthorized', 403));
            }
            
            next();
        } catch (error) {
            next(new AppError('Permission check failed', 500, error));
        }
    };
};