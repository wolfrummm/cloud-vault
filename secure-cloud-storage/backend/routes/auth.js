const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

// Signup
router.post("/signup", async (req,res)=>{
 try {

   const { email, password } = req.body

   // basic validation
   if(!email || !password) {
     return res.status(400).send("Email and password required")
   }

   if(password.length < 6) {
     return res.status(400).send("Password must be at least 6 characters")
   }

   // check if user exists
   const existingUser = await User.findOne({ email })
   if(existingUser) {
     return res.status(400).send("User already exists")
   }

   // hash password
   const hashedPassword = await bcrypt.hash(password, 10)

   const newUser = new User({
     email,
     password: hashedPassword
   })

   await newUser.save()

   res.json({ message: "User created successfully" })

 } catch(err) {
   res.status(500).send(err.message)
 }
})

// Login
router.post("/login", async (req,res)=>{
 try{
   const { email, password } = req.body

   const user = await User.findOne({ email })
   if(!user) return res.status(400).send("User not found")

   const validPassword = await bcrypt.compare(password, user.password)
   if(!validPassword) return res.status(401).send("Invalid password")

   const token = jwt.sign({ id:user._id }, process.env.JWT_SECRET)

   res.json({ token })

 }catch(err){
   res.status(500).send(err.message)
 }
})

module.exports = router