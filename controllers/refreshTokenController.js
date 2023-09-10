const User = require("../model/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });

  const foundUser = await User.findOne({ refreshToken }).exec();

  // detected rt reuse
  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.sendStatus(403); //forbidden
        console.log(`attempted refresh token reuse!`);
        const hackedUser = await User.findOne({
          username: decoded.username,
        }).exec();
        hackedUser.refreshToken = [];
        const result = await hackedUser.save();
        console.log(result);
      }
    );
    return res.sendStatus(403); //forbidden
  }

  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  // evaluate jwt
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        console.log(`expired refresh token`);
        foundUser.refreshToken = [...newRefreshTokenArray];
        const result = await foundUser.save();
        console.log(result);
      }
      if (err || foundUser.username !== decoded.username)
        return res.sendStatus(403);

      //refresh token was still valid
      const roles = Object.values(foundUser.roles);
      const accessToken = jwt.sign(
        { UserInfo: { username: decoded.username, roles: roles } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30s" }
      );
      const newRefreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      //saving new refreshToken with current user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      const result = await foundUser.save();
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "None",
        secure: true,
      });
      res.json({ roles, accessToken });
    }
  );
};

module.exports = { handleRefreshToken };
