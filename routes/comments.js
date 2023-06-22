const express = require("express");
const router = express.Router();
const auth_middleware = require("../middleware/auth_middleware");
const { Posts, Comments } = require("../models");

router
  .route("/posts/:postId/comments")
  .post(auth_middleware, async (req, res) => {
    const { postId } = req.params;
    const { nickname } = res.locals.user;
    const { comment } = req.body;
    // if (!nickname) {
    //   return res.status(404).json({ msg: "데이터 형식이 올바르지 않습니다" });
    // } auth_middleware에서 검증 했으므로 필요x
    if (!comment) {
      return res.status(404).json({ msg: "댓글 내용을 입력해주세요" });
    }
    const post = await Posts.findOne({ where: { postId } });
    if (!post) {
      return res.status(401).json({ message: "게시글을 찾지 못했습니다." });
    }
    try {
      await Comments.create({
        nickname,
        UserId: post.UserId,
        PostId: post.postId,
        comment,
      });
      res.status(200).json({ success: true, msg: "댓글을 생성하였습니다." });
    } catch (err) {
      res.status(400).json({ msg: "예기치 못한 오류 발생" });
    }
  })
  .get(async (req, res) => {
    const { postId } = req.params;
    const commentPageNum = req.query.commentPageNum
      ? req.query.commentPageNum
      : 1;
    const commentSize = req.query.commentSize ? req.query.commentSize : 10;
    if (!commentPageNum || !commentSize) {
      return res.status(400).json({ msg: "데이터 형식이 올바르지 않습니다" });
    }
    try {
      const comments = await Comments.findAll({
        where: { PostId: postId },
        order: [["createdAt", "DESC"]],
        attributes: ["commentId", "comment", "createdAt", "updatedAt"],
        limit: commentSize,
        offset: commentSize * (commentPageNum - 1),
      });

      return res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (err) {
      res.status(500).json({ msg: "예기치 못한 오류 발생" });
    }
  });

router
  .route("/posts/comments/:commentId")
  .put(
    //만약 postId를 사용할 필요가 없다면 url을 수정?
    auth_middleware, //아니면, url을 일관성있게 유지하기 위해 놔두기?
    async (req, res) => {
      const { commentId } = req.params;
      const { comment } = req.body;
      const { userId } = res.locals.user;
      if (!commentId) {
        return res.status(400).json({ msg: "데이터 형식이 올바르지 않습니다" });
      } else if (!comment) {
        return res.status(400).json({ msg: "댓글 내용이 존재하지 않습니다" });
      }
      try {
        const [updatedCount] = await Comments.update(
          { comment },
          {
            where: { UserId: userId, commentId },
          }
        );
        if (!updatedCount) {
          return res
            .status(404)
            .json({ msg: "수정할 수 있는 권한이 없습니다." });
        }
        return res
          .status(200)
          .json({ msg: "댓글이 정상적으로 수정되었습니다." });
      } catch (err) {
        return res.status(500).json({ msg: "예기치 못한 오류 발생" });
      }
    }
  )
  .delete(auth_middleware, async (req, res) => {
    const { commentId } = req.params;
    const { userId } = res.locals.user;
    if (!commentId) {
      return res.status(400).json({ msg: "url이 올바르지 않습니다" });
    }
    try {
      const deletedCount = await Comments.destroy({
        where: { UserId: userId, commentId },
      });
      if (!deletedCount) {
        return res.status(404).json({ msg: "댓글삭제에 실패하였습니다." });
      }
      return res.status(200).json({ msg: "댓글이 성공적으로 삭제되었습니다." });
    } catch (err) {
      return res.status(500).json({ msg: "예기치 못한 오류 발생" });
    }
  });

module.exports = router;
