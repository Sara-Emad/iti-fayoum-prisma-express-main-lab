const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

exports.createComment = async (req, res, next) => {
    try {
        const { content, parentId } = req.body;
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
        if (!post) return next(new AppError('Post not found', 404));

        // إذا كان هناك parentId، تحقق من وجود التعليق الأصلي
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({ 
                where: { id: Number(parentId) } 
            });
            if (!parentComment) return next(new AppError('Parent comment not found', 404));
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId: userId,
                postId: Number(postId),
                parentId: parentId ? Number(parentId) : null
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        next(new AppError('Error creating comment', 500, error));
    }
};

exports.getAllComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10, search } = req.query;
        const skip = (page - 1) * limit;

        // تحقق من وجود المنشور
        const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
        if (!post) return next(new AppError('Post not found', 404));

        // إنشاء الفلتر للبحث
        const filter = {
            postId: Number(postId),
            ...(search && { content: { contains: search, mode: 'insensitive' } }),
            parentId: null // نجلب فقط التعليقات الرئيسية وليس الردود
        };

        // جلب عدد التعليقات الكلي للصفحات
        const totalComments = await prisma.comment.count({ where: filter });
        const totalPages = Math.ceil(totalComments / limit);

        // جلب التعليقات مع الردود
        const comments = await prisma.comment.findMany({
            where: filter,
            include: {
                author: { select: { id: true, name: true, email: true } },
                replies: {
                    include: {
                        author: { select: { id: true, name: true, email: true } }
                    }
                }
            },
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            comments,
            pagination: {
                totalComments,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(new AppError('Error fetching comments', 500, error));
    }
};

exports.getCommentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const comment = await prisma.comment.findUnique({
            where: { id: Number(id) },
            include: {
                author: { select: { id: true, name: true, email: true } },
                replies: {
                    include: {
                        author: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        if (!comment) return next(new AppError('Comment not found', 404));

        res.status(200).json(comment);
    } catch (error) {
        next(new AppError('Error fetching comment', 500, error));
    }
};

exports.updateComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
        if (!comment) return next(new AppError('Comment not found', 404));
        if (comment.authorId !== userId) return next(new AppError('Unauthorized', 403));

        const updatedComment = await prisma.comment.update({
            where: { id: Number(id) },
            data: { content, updatedAt: new Date() }
        });

        res.status(200).json(updatedComment);
    } catch (error) {
        next(new AppError('Error updating comment', 500, error));
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const comment = await prisma.comment.findUnique({ 
            where: { id: Number(id) },
            include: { post: true }
        });
        
        if (!comment) return next(new AppError('Comment not found', 404));
        
        // السماح بالحذف إذا كان المستخدم هو كاتب التعليق أو صاحب المنشور
        if (comment.authorId !== userId && comment.post.authorId !== userId) {
            return next(new AppError('Unauthorized', 403));
        }

        await prisma.comment.delete({ where: { id: Number(id) } });

        res.status(204).send();
    } catch (error) {
        next(new AppError('Error deleting comment', 500, error));
    }
};

// وظيفة إضافية للبحث عن التعليقات
exports.searchComments = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return next(new AppError('Search query is required', 400));

        const comments = await prisma.comment.findMany({
            where: {
                content: {
                    contains: q,
                    mode: 'insensitive'
                }
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
                post: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.status(200).json(comments);
    } catch (error) {
        next(new AppError('Error searching comments', 500, error));
    }
};