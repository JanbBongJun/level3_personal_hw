const express = require("express")
const router = express.Router()
const postsRouter = require('./posts.js')
const commentRouter = require('./comments.js')
const users = require("./users.js")
const auth = require("./auth.js")

router.use("/api",[postsRouter,commentRouter,users,auth])

module.exports = router;