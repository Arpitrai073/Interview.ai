import crypto from "node:crypto"
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/razorpay.service.js";

// Server side catalogue: price and credits are never taken from the client.
const PLANS = {
    basic: { amount: 100, credits: 150 },
    pro: { amount: 500, credits: 650 },
}

export const createOrder = async (req,res) => {
    try {
        const {planId} = req.body;
        const plan = typeof planId === "string" ? PLANS[planId] : undefined

        if (!plan) {
            return res.status(400).json({ message: "Invalid plan" });
        }

        const options = {
            amount: plan.amount * 100, // convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options)

        await Payment.create({
            userId: req.userId,
            planId,
            amount: plan.amount,
            credits: plan.credits,
            razorpayOrderId: order.id,
            status: "created",
        });

        return res.json(order);

    } catch (error) {
        console.error("createOrder error:", error)
        return res.status(500).json({message:"Failed to create Razorpay order"})
    }
}


export const verifyPayment = async (req,res) => {
    try {
        const {razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature} = req.body

        if (
            typeof razorpay_order_id !== "string" ||
            typeof razorpay_payment_id !== "string" ||
            typeof razorpay_signature !== "string"
        ) {
            return res.status(400).json({ message: "Invalid payment payload" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        const providedSignature = Buffer.from(razorpay_signature, "utf8")
        const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8")

        if (
            providedSignature.length !== expectedSignatureBuffer.length ||
            !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
        ) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // Atomic transition so a replayed callback cannot credit the account twice.
        const payment = await Payment.findOneAndUpdate(
            {
                razorpayOrderId: razorpay_order_id,
                userId: req.userId,
                status: "created",
            },
            {
                status: "paid",
                razorpayPaymentId: razorpay_payment_id,
            },
            { new: true }
        );

        if (!payment) {
            const existing = await Payment.findOne({
                razorpayOrderId: razorpay_order_id,
                userId: req.userId,
            });

            if (!existing) {
                return res.status(404).json({ message: "Payment not found" });
            }

            return res.json({ message: "Already processed" });
        }

        // Add credits to user
        const updatedUser = await User.findByIdAndUpdate(payment.userId, {
            $inc: { credits: payment.credits }
        },{new:true});

        res.json({
            success: true,
            message: "Payment verified and credits added",
            user: updatedUser,
        });

    } catch (error) {
        console.error("verifyPayment error:", error)
        return res.status(500).json({message:"Failed to verify Razorpay payment"})
    }
}
