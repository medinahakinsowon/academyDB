import express from "express";
import * as paymentCtrl from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/initiate", protect, paymentCtrl.initiatePayment);
router.get("/verify/:reference", protect, paymentCtrl.verifyPayment);
router.post("/mock", protect, paymentCtrl.mockPayment);
router.get("/my-payments", protect, paymentCtrl.getMyPayments);

export default router;
