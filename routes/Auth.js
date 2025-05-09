const express=require('express')
const router=express.Router()
const authController=require("../controllers/Auth")
const { verifyToken } = require('../middleware/verifyToken')

router
    .post('/signup',authController.signup)
    .post('/login',authController.login)
    .get('/logout',verifyToken,authController.logout)
    .get('/check-auth',verifyToken, authController.checkAuth)


module.exports=router