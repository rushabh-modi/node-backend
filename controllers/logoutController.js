const User = require("../model/User");

const handleLogout = async (req, res) => {
  // on clientside also delete access token

  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //no content
  const refreshToken = cookies.jwt;

  //is refreshtoken in db?
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
    });
    return res.sendStatus(204);
  }

  // delere refreshToken in db
  foundUser.refreshToken = "";
  const result = await foundUser.save();
  console.log(result);

  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  }); //secure: true on https
  res.sendStatus(204);
};

module.exports = { handleLogout };
