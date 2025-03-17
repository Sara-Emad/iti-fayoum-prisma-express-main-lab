const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();
const { verifyUser } = require('../middlewares/auth'); // تأكد من أن لديك ملف المصادقة الصحيح

// جلب جميع التعليقات لمنشور معين
router.get('/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { postId: Number(postId) },
            include: {
                author: { select: { id: true, name: true, email: true } }
            }
        });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching comments" });
    }
});

// إنشاء تعليق جديد
router.post('/:postId/comments', verifyUser, async (req, res) => {
    try {
        const { content, parentId } = req.body;
        const { postId } = req.params;

        const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId: req.user.id,
                postId: Number(postId),
                parentId: parentId ? Number(parentId) : null
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: "Error creating comment" });
    }
});

// تحديث تعليق
router.put('/comments/:id', verifyUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        if (comment.authorId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        const updatedComment = await prisma.comment.update({
            where: { id: Number(id) },
            data: { content, updatedAt: new Date() }
        });

        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(500).json({ message: "Error updating comment" });
    }
});

// حذف تعليق
router.delete('/comments/:id', verifyUser, async (req, res) => {
    try {
        const { id } = req.params;

        const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        if (comment.authorId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        await prisma.comment.delete({ where: { id: Number(id) } });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error deleting comment" });
    }
});

module.exports = router;
