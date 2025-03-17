const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

const verifyUser = async (req, res, next) => {
  try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
          return res.status(401).json({ message: "Token is missing" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { email: payload.email } });

      if (!user) {
          return res.status(401).json({ message: "User not found in database" });
      }

      req.user = user;
      next();
  } catch (err) {
      console.error("JWT Error:", err);
      res.status(401).json({ message: "Invalid token", error: err.message });
  }
};



router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                },
                comments: true
            }
        });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts" });
    }
});

// إنشاء منشور جديد
router.post('/', verifyUser, async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await prisma.post.create({
            data: {
                title,
                content,
                authorId: req.user.id
            }
        });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error creating post" });
    }
});

// جلب منشور محدد
router.get('/:id', async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                author: { select: { id: true, name: true, email: true } },
                comments: true
            }
        });

        if (!post) return res.status(404).json({ message: "Post not found" });

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error fetching post" });
    }
});

// تحديث منشور
router.put('/:id', verifyUser, async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });

        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.authorId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        const updatedPost = await prisma.post.update({
            where: { id: Number(req.params.id) },
            data: { title, content, updatedAt: new Date() }
        });

        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: "Error updating post" });
    }
});

// حذف منشور
router.delete('/:id', verifyUser, async (req, res) => {
    try {
        const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) } });

        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.authorId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        await prisma.post.delete({ where: { id: Number(req.params.id) } });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error deleting post" });
    }
});

module.exports = router;
