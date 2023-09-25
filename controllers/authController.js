const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc Login
// @route POST /auth
// @access Public
const handleLogin = async (req, res) => {
  const cookies = req.cookies;
  console.log(`cookie available at login: ${JSON.stringify(cookies)}`);

  const { user, pwd } = req.body;
  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: 'Username and password are required.' });

  const foundUser = await User.findOne({ username: user }).exec();
  if (!foundUser) return res.sendStatus(401); //Unauthorized

  // evaluate password
  const match = await bcrypt.compare(pwd, foundUser.password);

  if (match) {
    const roles = Object.values(foundUser.roles).filter(Boolean);
    // create JWTs
    const accessToken = jwt.sign(
      { UserInfo: { username: foundUser.username, roles: roles } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '60s' }
    );

    const newRefreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    );

    const newRefreshTokenArray = !cookies?.jwt
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

    if (cookies?.jwt) {
      const refreshToken = cookies.jwt;
      const foundToken = await User.findOne({ refreshToken }).exec();

      //detected rt reuse
      if (!foundToken) {
        console.log(`attempted rt reuse at login`);
        newRefreshTokenArray = [];
      }

      res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
      });
    }

    //saving refreshToken with current user
    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    const result = await foundUser.save();
    console.log(result);
    console.log(roles);

    //! store refreshtoken only in httponly cookie format
    res.cookie('jwt', newRefreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'None',
      secure: true,
    }); //http: secure when in production

    res.json({ accessToken });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
