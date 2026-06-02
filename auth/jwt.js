const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(400).send("login first");
    
    token = token.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_VAL, (err, decoded) => {
        if (err) return res.status(400).send("invalid token");
        req.user = decoded; // هنا الـ role سيكون موجوداً إذا تم إضافته في الـ login
        next();
    });
};
module.exports = auth;