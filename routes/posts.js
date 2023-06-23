const express = require("express");
const router = express.Router();
const auth_middleware = require("../middleware/auth_middleware");
const { Posts, Users } = require("../models");
const { Op } = require("sequelize");

router
  .route("/posts")
  .post(auth_middleware, async (req, res) => {
    const { userId } = res.locals.user;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(412).json({ msg: "데이터 형식이 올바르지 않습니다" });
    }

    try {
      await Posts.create({ UserId: userId, title, content });

      return res.status(201).json({ msg: "게시글이 저장되었습니다" });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        msg: "데이터베이스 연결오류",
      });
    }
  })
  .get(async (req, res) => {
    const pageNum = req.query.pageNum ? req.query.pageNum : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;

    try {
      const posts = await Posts.findAll({
        attributes: ["postId", "UserId", "title", "createdAt", "updatedAt"],
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Users,
            attributes: ["nickname"],
          },
        ],
        limit: pageSize/1,
        offset: pageSize * (pageNum - 1),
      });
      res.status(200).json({
        success: true,
        page: pageNum,
        posts,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, msg: "데이터베이스 연결 오류" });
    }
  });

  
router
  .route("/posts/:postId")
  .get(async (req, res) => {
    const { postId } = req.params;

    try {
      const data = await Posts.findOne({
        where: { postId },
        attributes: [
          "postId",
          "UserId",
          "title",
          "content",
          "createdAt",
          "updatedAt",
        ],
      });
      if (!data) {
        return res.status(403).json({ msg: "데이터를 찾을 수 없습니다" });
      } else {
        return res.status(200).json({ success: true, data: data });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "데이터베이스 연결 오류" });
    }
  })
  .put(auth_middleware, async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    const { userId } = res.locals.user;
    const post = await Posts.findOne({ where: { postId } });
    if (!title || !content) {
      return res
        .status(412)
        .json({ msg: "게시글 또는 타이틀이 존재하지 않습니다" });
    }
    if (userId !== post.UserId) {
      return res
        .status(403)
        .json({ message: "수정 권한이 존재하지 않습니다." });
    }

    post.title = title;
    post.content = content;
    await post
      .save()
      .then((updatePost) => {
        if (!updatePost) {
          return res
            .status(401)
            .json({ message: "게시글이 정상적으로 수정되지 않았습니다" });
        }
        return res
          .status(200)
          .json({ msg: "게시글을 정상적으로 수정하였습니다." });
      })
      .catch((err) => {
        return res.status(500).json({ msg: "데이터베이스 연결 오류" });
      });
  })
  .delete(auth_middleware, async (req, res) => {
    const { postId } = req.params;
    const { userId } = res.locals.user;

    try {
      const deletedCount = await Posts.destroy({
        where:{ [Op.and]:[ {postId}, {UserId: userId}]} ,
      });
      if (!deletedCount) {
        return res.status(404).json({ msg: "게시글 삭제에 실패하였습니다." });
      }
      return res.status(200).json({ msg: "게시글을 삭제하였습니다." });
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        error: err,
        msg: "예기치 못한 오류 발생",
      });
    }
  });

module.exports = router;
