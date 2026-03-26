// import express from "express";
// import * as paymentCtrl from "../controllers/payment.controller.js";
// import { protect, restrictTo } from "../middleware/auth.middleware.js";

// const router = express.Router();

// router.post("/initiate", protect, paymentCtrl.initiatePayment);
// router.get("/verify/:reference", protect, paymentCtrl.verifyPayment);
// router.post("/mock", protect, paymentCtrl.mockPayment);
// router.get("/my-payments", protect, paymentCtrl.getMyPayments);

// // Admin: list all payments
// router.get("/", protect, restrictTo("admin"), paymentCtrl.getAllPayments);

// export default router;



import express from "express";
import * as paymentCtrl from "../controllers/payment.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

// Paystack webhook — must be raw body, no auth middleware
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentCtrl.paystackWebhook,
);

// Student
router.post("/initiate", protect, paymentCtrl.initiatePayment);
router.get("/verify/:reference", protect, paymentCtrl.verifyPayment);
router.post("/mock", protect, paymentCtrl.mockPayment);
router.get("/my-payments", protect, paymentCtrl.getMyPayments);

// Admin
router.get("/", protect, restrictTo("admin"), paymentCtrl.getAllPayments);

export default router;





