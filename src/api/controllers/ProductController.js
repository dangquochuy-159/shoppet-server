const fs = require('fs')
const appRoot = require('app-root-path');

const Product = require('../models/ProductModel')
const pathProduct = '/src/api/public/uploads/products/'

// GET /api/products
const getListProduct = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.json({
                data: products,
                message: 'success',
            })
        })
        .catch(next)
}

// GET /api/products/search?name=&quantity=
const searchProduct = (req, res, next) => {
    Product
        .find({ name: { $regex: new RegExp(req.query.name, 'i') } })
        .limit(Number(req.query.quantity))
        .then((products) => {
            res.json({
                data: products,
                message: 'success',
            })
        })
        .catch(next)
}

// GET /api/products/filter?filter=&value=&size=&page=
const filterProduct = (req, res, next) => {

    let filters = [];
    let values = [];

    filters = filters.concat(req.query.filter);
    values = values.concat(req.query.value);

    let value = isNaN(req.query.value) ? req.query.value : Number(req.query.value)
    let limit = Number(req.query.size)
    let skip = (req.query.page - 1) * limit

    const query = {};
    for (let i = 0; i < filters.length; i++) {
        isNaN(values[i]) ? query[filters[i]] = values[i] :
            query[filters[i]] = { $lt: Number(values[i]) }
    }
    Promise.all([
        Product.find(query).skip(skip).limit(limit),
        Product.find({})
    ])
        .then(([productsFilter, products]) => {
            res.json({
                data: productsFilter,
                page: Number(req.query.page),
                length: products.length,
                message: 'success',
            })
        })
}

// GET /api/products/:id
const getOneProduct = (req, res, next) => {
    Product.findById(req.params.id)
        .then((product) => {
            res.json({
                data: product,
                message: 'success',
            })
        })
}

// GET /api/products/:id/:photo
const getPhotoProduct = (req, res, next) => {
    let photoPath = appRoot + pathProduct + req.params.photo;
    res.sendFile(photoPath);
}

// POST /api/products
const addProduct = (req, res, next) => {

    const photoStr = req.files.photo.map(file => file.originalname).join()
    const photo_detail = req.files.photo_detail.map(file => file.originalname)
    let arrColor = req.body.color ? req.body.color.split('-') : []
    const product = new Product({
        name: req.body.name,
        category: req.body.category,
        des: req.body.des,
        origin: req.body.origin,
        quantity: Number(req.body.quantity),
        price: Number(req.body.price),
        sale_price: Number(req.body.sale_price),
        photo: photoStr,
        outstand: req.body.outstand,
        color: arrColor,
        photo_detail: photo_detail,
        status: {
            in_stock: req.body.quantity > 5,
            low_stock: req.body.quantity <= 5 && req.body.quantity > 0,
            out_stock: req.body.quantity == 0,
        }
    })
        .save()
        .then(() => {
            res.status(200).json({
                message: 'success'
            });
        })
        .catch(next)
}

// DELETE /api/products/:id
const removeProduct = (req, res, next) => {
    Product.findOneAndDelete({ _id: req.params.id })
        .then(product => {
            let photo = product.photo
            let photo_detail = product.photo_detail
            let namePhoto
            let pathPhoto
            photo_detail.push(photo)
            for (let pt of photo_detail) {
                namePhoto = pt
                pathPhoto = appRoot + pathProduct + namePhoto
                fs.unlink(pathPhoto, (err) => {
                    if (err) {
                        return
                    }
                })
            }
            res.status(200).json({
                message: 'success'
            });
        })
        .catch(next)
}

// PUT /api/products/:id
const updateProduct = (req, res, next) => {
    const updateProduct = {}
    for (let key in req.body) {
        if (req.body[key] !== '') {
            updateProduct[key] = req.body[key];
        }
    }
    req.files.photo ? updateProduct.photo = req.files.photo.map(file => file.filename).join() : updateProduct
    req.files.photo_detail ? updateProduct.photo_detail = req.files.photo_detail.map(file => file.filename) : updateProduct

    if (req.body.quantity) {
        updateProduct.status = {
            in_stock: req.body.quantity > 5,
            low_stock: req.body.quantity <= 5 && req.body.quantity > 0,
            out_stock: req.body.quantity == 0,
        }
    }

    Product.findByIdAndUpdate(req.params.id, updateProduct)
        .then((product) => {
            let namePhoto
            let pathPhoto
            if (updateProduct.photo) {
                let photo = product.photo
                namePhoto = photo
                pathPhoto = appRoot + pathProduct + namePhoto
                fs.unlink(pathPhoto, (err) => {
                    if (err) {
                        return
                    }
                })
            }
            if (updateProduct.photo_detail) {
                let photo_detail = product.photo_detail
                for (let pt of photo_detail) {
                    namePhoto = pt
                    pathPhoto = appRoot + pathProduct + namePhoto
                    fs.unlink(pathPhoto, (err) => {
                        if (err) {
                            return
                        }
                    })
                }
            }
            res.status(200).json({
                message: 'success'
            });
        })
        .catch(next)
}

// PUT api/products/quantity
const updateQuantityProduct = (req, res, next) => {
    let updateArr = req.body


    updateArr.forEach((item) => {
        Product.updateOne(
            { _id: item.id },
            { $inc: { quantity: -Number(item.quantity) } }
        ).then(() => { })
    })
    res.json({
        message: updateArr,
    })

}

module.exports = {
    getListProduct,
    searchProduct,
    filterProduct,
    getOneProduct,
    getPhotoProduct,
    addProduct,
    removeProduct,
    updateProduct,
    updateQuantityProduct,
}