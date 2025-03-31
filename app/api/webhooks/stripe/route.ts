import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export const POST = async (req: NextRequest) => {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    } catch (error) {
        const err = error as Error;
        console.error("Webhook signature verification failed:", err.message);
        return new Response("Invalid signature", { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed":
                const session = await stripe.checkout.sessions.retrieve(
                    (event.data.object as Stripe.Checkout.Session).id,
                    {
                        expand: ["line_items"],
                    }
                );

                const customerId = session.customer as string;
                const customerDetails = session.customer_details;

                if (customerDetails?.email) {
                    const user = await prisma.user.findUnique({
                        where: { email: customerDetails.email },
                    });

                    if (!user) throw new Error("User not found");

                    // Save customerId if not saved
                    if (!user.customerId) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { customerId },
                        });
                    }

                    const lineItems = session.line_items?.data || [];

                    for (const item of lineItems) {
                        const priceId = item.price?.id;
                        const isSubscription = item.price?.type === "recurring";
                        const amount = item.amount_total || 0;

                        if (!priceId) throw new Error("Missing priceId");

                        if (isSubscription) {
                            // Calculate end date
                            let endDate = new Date();
                            if (priceId === process.env.STRIPE_YEARLY_PRICEID) {
                                endDate.setFullYear(endDate.getFullYear() + 1);
                            } else if (priceId === process.env.STRIPE_MONTHLY_PRICEID) {
                                endDate.setMonth(endDate.getMonth() + 1);
                            } else {
                                throw new Error("Invalid priceId");
                            }

                            // Upsert Payment
                            await prisma.payment.upsert({
                                where: { stripePaymentId: session.payment_intent as string },
                                create: {
                                    stripePaymentId: session.payment_intent as string,
                                    amount,
                                    status: "completed",
                                    userEmail: user.email,
                                    priceId,
                                },
                                update: {
                                    status: "completed",
                                    amount,
                                    priceId,
                                },
                            });

                            // Update user status and priceId
                            await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    status: "active",
                                    priceId,
                                },
                            });
                        } else {
                            console.log("Non-subscription item purchased. Skipping...");
                        }
                    }
                }

                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return new Response("Received", { status: 200 });
    } catch (error) {
        console.error("Webhook handler error:", (error as Error).message);
        return new Response("Webhook handler failed", { status: 500 });
    }
};
