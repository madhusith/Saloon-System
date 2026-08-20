import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { productController } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
    createProductSchema,
    updateProductSchema,
    adjustStockSchema
} from '../validators/productValidator.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();

router.use(authenticate);

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductDetails);

// Administrative Catalog & Stock adjustment endpoints
router.post('/', validate(createProductSchema), productController.createProduct);
router.post('/upload', upload.single('image'), productController.uploadImage);
router.patch('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/adjust-stock', validate(adjustStockSchema), productController.adjustStock);

export default router;
