const { Schema, default: mongoose } = require("mongoose")
const Product=require("../models/Product")
const Brand = require("../models/Brand");


exports.create = async (req, res) => {
  try {
    let { brand: brandName, ...productData } = req.body;

    if (!brandName) {
      return res.status(400).json({ message: "Brand name is required" });
    }

    // Find brand by name (case-insensitive)
    let brand = await Brand.findOne({ name: new RegExp(`^${brandName.trim()}$`, "i") });

   
    if (!brand) {
      brand = new Brand({ name: brandName.trim() });
      await brand.save();
    }

   
    productData.brand = brand._id;

    const createdProduct = new Product(productData);
    await createdProduct.save();

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding product, please try again later" });
  }
};


exports.getAll = async (req, res) => {
    try {
        const filter={}
        const sort={}
        let skip=0
        let limit=0

        if(req.query.brand){
            filter.brand={$in:req.query.brand}
        }


        if(req.query.user){
            filter['isDeleted']=false
        }

        if(req.query.sort){
            sort[req.query.sort]=req.query.order?req.query.order==='asc'?1:-1:1
        }

        if(req.query.page && req.query.limit){

            const pageSize=req.query.limit
            const page=req.query.page

            skip=pageSize*(page-1)
            limit=pageSize
        }

        const totalDocs=await Product.find(filter).sort(sort).populate("brand").countDocuments().exec()
        const results=await Product.find(filter).sort(sort).populate("brand").skip(skip).limit(limit).exec()

        res.set("X-Total-Count",totalDocs)

        res.status(200).json(results)
    
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error fetching products, please try again later'})
    }
};

exports.getById=async(req,res)=>{
    try {
        const {id}=req.params
        const result=await Product.findById(id).populate("brand")
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Error getting product details, please try again later'})
    }
}

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Handle brand update if brand is provided
    if (updateData.brand) {
      const brandName = updateData.brand;

      // Find brand by name (case-insensitive)
      let brand = await Brand.findOne({ name: new RegExp(`^${brandName.trim()}$`, "i") });

      // If not found, create it
      if (!brand) {
        brand = new Brand({ name: brandName.trim() });
        await brand.save();
      }

      // Replace brand name with ObjectId
      updateData.brand = brand._id;
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating product, please try again later" });
  }
};


exports.deleteById = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Product.findByIdAndDelete(id); 
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error deleting product, please try again later" });
    }
  };
  

