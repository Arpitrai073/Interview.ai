import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/razorpay.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto"

export const createOrder = asyncHandler("failed to create Razorpay order", async (req, res) => {
    const { planId, amount, credits } = req.body;
    if (!amount || !credits) {
        return res.status(400).json({ message: "Invalid plan data" });
    }

    const order = await razorpay.orders.create({
        amount: amount * 100, // convert to paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    })

    await Payment.create({
        userId: req.userId,
        planId,
        amount,
        credits,
        razorpayOrderId: order.id,
        status: "created",
    });

    return res.json(order);
})


export const verifyPayment = asyncHandler("failed to verify Razorpay payment", async (req, res) => {
    const { razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature } = req.body

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status === "paid") {
        return res.json({ message: "Already processed" });
    }

    // Update payment record
    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    // Add credits to user
    const updatedUser = await User.findByIdAndUpdate(payment.userId, {
        $inc: { credits: payment.credits }
    }, { new: true });

    res.json({
        success: true,
        message: "Payment verified and credits added",
        user: updatedUser,
    });
})
