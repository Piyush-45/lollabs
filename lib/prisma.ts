import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


// import { prisma } from '@/lib/prisma'; // adjust to your path
export
    async function createTestUser() {
    const user = await prisma.user.create({
        data: {
            email: 'piyushtyagidev@gmail.com',
            fullName: 'piyush tyagi',
            // customerId: 'cus_test123÷',       // optional, for Stripe testing
            // priceId: 'price_test123',        // optional, if you're testing plans
            // status: 'active'                 // or leave as default "inactive"
        }
    });

    console.log('Test user created:', user);
}

