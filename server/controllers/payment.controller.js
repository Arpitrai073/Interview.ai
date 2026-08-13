import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/razorpay.service.js";
import crypto from "crypto"
import ApiError from "../utils/ApiError.js";

export const createOrder = async (req,res,next) => {
    try {
        const {planId, amount, credits} = req.body;
          if (!amount || !credits) {
      return res.status(400).json({ message: "Invalid plan data" });
    }

     const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    let order
    try {
      order = await razorpay.orders.create(options)
    } catch (error) {
      console.error("Razorpay order creation failed:", error?.error || error)
      throw new ApiError(502, "Could not reach the payment provider. Please try again.", { cause: error })
    }

     await Payment.create({
      userId: req.userId,
      planId,
      amount,
      credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.json(order);

    
    } catch (error) {
         return next(error)
    }
}


export const verifyPayment = async (req,res,next) => {
    try {
        const {razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature} = req.body

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Missing payment verification details.")
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("RAZORPAY_KEY_SECRET is not configured")
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
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

    if (payment.userId.toString() !== req.userId) {
      throw new ApiError(403, "This payment does not belong to you.")
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
    },{new:true});

    if (!updatedUser) {
      throw new ApiError(404, "Paid user account no longer exists. Please contact support.")
    }

    return res.json({
      success: true,
      message: "Payment verified and credits added",
      user: updatedUser,
    });

    } catch (error) {
         return next(error)
    }
}
