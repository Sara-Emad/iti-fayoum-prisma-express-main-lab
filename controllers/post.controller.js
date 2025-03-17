const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

exports.createPost = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.id; 
        const post = await prisma.post.create({
            data: { title, content, authorId: userId }
        });

        res.status(201).json(post);
    } catch (error) {
        next(new AppError('Error creating post', 500, error));
    }
};

exports.getAllPosts = async (req, res, next) => {
    try {
        const posts = await prisma.post.findMany({
            include: { author: true, comments: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(posts);
    } catch (error) {
        next(new AppError('Error fetching posts', 500, error));
    }
};

exports.getPostById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({
            where: { id: Number(id) },
            include: { author: true, comments: { include: { author: true, replies: true } } }
        });

        if (!post) return next(new AppError('Post not found', 404));

        res.status(200).json(post);
    } catch (error) {
        next(new AppError('Error fetching post', 500, error));
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id;

        const post = await prisma.post.findUnique({ where: { id: Number(id) } });
        if (!post) return next(new AppError('Post not found', 404));
        if (post.authorId !== userId) return next(new AppError('Unauthorized', 403));

        const updatedPost = await prisma.post.update({
            where: { id: Number(id) },
            data: { title, content, updatedAt: new Date() }
        });

        res.status(200).json(updatedPost);
    } catch (error) {
        next(new AppError('Error updating post', 500, error));
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const post = await prisma.post.findUnique({ where: { id: Number(id) } });
        if (!post) return next(new AppError('Post not found', 404));
        if (post.authorId !== userId) return next(new AppError('Unauthorized', 403));

        await prisma.post.delete({ where: { id: Number(id) } });

        res.status(204).send();
    } catch (error) {
        next(new AppError('Error deleting post', 500, error));
    }
};
