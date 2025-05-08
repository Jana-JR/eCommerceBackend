exports.sanitizeUser=(user)=>{
    return {_id:user._id,
        email:user.email,
        isAdmin:user.isAdmin}
}