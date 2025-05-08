const User=require("../models/User");
const { sanitizeUser } = require("../utils/SanitizeUser");

exports.getById=async(req,res)=>{
    try {
        // Validate ID parameter
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ error: "Invalid user ID format" });
        }
    
        // Check if requesting user has permission
        if (req.params.id !== req.user?.userId && !req.user?.isAdmin) {
          return res.status(403).json({ error: "Unauthorized access" });
        }
    
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
    
        res.status(200).json(sanitizeUser(user)); 
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error getting your details, please try again later'})
    }
}
exports.updateById=async(req,res)=>{
    try {
        const {id}=req.params
        const updated=(await User.findByIdAndUpdate(id,req.body,{new:true})).toObject()
        delete updated.password
        res.status(200).json(updated)

    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error getting your details, please try again later'})
    }
}