const Brand=require("../models/Brand")


exports.create = async (req, res) => {
    try {
        const brand = new Brand({ name: req.body.name });
        const saved = await brand.save();
        res.status(201).json(saved);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error creating brand" });
    }
};


exports.getAll=async(req,res)=>{
    try {
        const result=await Brand.find({})
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error fetching brands"})
    }
}