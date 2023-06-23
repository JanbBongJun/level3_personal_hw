const jwt = require("jsonwebtoken");
const {Users} = require("../models");

module.exports = async (req, res, next) => {
  const { Authorization } = req.cookies;
  const [authType, authToken] = (Authorization ?? "").split(" ");
  // console.log("Authorization:"+Authorization)
  // console.log("authType:"+authType);
  // console.log("authToken:"+authToken)
  if (!authToken || authType !== "Bearer"||Authorization) {
    console.log(authToken);
    console.log(authType);
    return res
      .status(403)
      .json({ message: "로그인 후 이용가능한 기능입니다." });
  }
  try {
    const { nickname } = jwt.verify(authToken, "customized-secret-key");
    const user = await Users.findOne({where: {nickname} });
    // console.log(user)
    if (!user) {
      res.clearCookie("Authorization");
      return res.status(403).json({ message: "전달된 쿠키에서 오류가 발생하였습니다." });
    }
    res.locals.user = user;
    next();
  } catch (err) {
    res.clearCookie("Authorization");
    return res.status(403).json({ message: "전달된 쿠키에서 오류가 발생하였습니다" });
  }
};
