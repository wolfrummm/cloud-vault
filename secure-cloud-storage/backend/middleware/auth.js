const jwt = require("jsonwebtoken")

module.exports = function(req,res,next){
 try{
   const token = req.headers.authorization

   if(!token) return res.status(401).send("Access denied")

   const decoded = jwt.verify(token, process.env.JWT_SECRET)

   req.user = decoded
   next()

 }catch(err){
   res.status(400).send("Invalid token")
 }
}