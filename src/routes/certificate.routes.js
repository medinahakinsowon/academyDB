import express from 'express';
import {
  issueCertificate,
  getAllCertificates,
  revokeCertificate,
  getMyCertificates,
  verifyCertificate,
} from '../controllers/certificate.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student
router.get('/my', protect, getMyCertificates);

// Public verify
router.get('/verify/:certificateId', verifyCertificate);

// Admin
router.get('/',                           protect, restrictTo('admin'), getAllCertificates);
router.post('/issue/:enrollmentId',       protect, restrictTo('admin'), issueCertificate);
router.delete('/:id',                     protect, restrictTo('admin'), revokeCertificate);

export default router;