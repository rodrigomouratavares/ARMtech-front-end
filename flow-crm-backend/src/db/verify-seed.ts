import 'dotenv/config';
import { db, checkDatabaseConnection } from './connection';
import { users } from './schema/users';
import { customers } from './schema/customers';
import { products } from './schema/products';
import { preSales, preSaleItems } from './schema/presales';

/**
 * Verification script to check seeded data in the database
 */

async function verifySeededData() {
    console.log('🔍 Verifying seeded data...');
    console.log('=====================================');

    try {
        // Check database connection
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
            throw new Error('Database connection failed');
        }
        console.log('✅ Database connection verified');

        // Count records in each table
        const userCount = await db.select().from(users);
        const customerCount = await db.select().from(customers);
        const productCount = await db.select().from(products);
        const preSaleCount = await db.select().from(preSales);
        const preSaleItemCount = await db.select().from(preSaleItems);

        console.log('');
        console.log('📊 Database Contents:');
        console.log(`   • Users: ${userCount.length}`);
        console.log(`   • Customers: ${customerCount.length}`);
        console.log(`   • Products: ${productCount.length}`);
        console.log(`   • Pre-sales: ${preSaleCount.length}`);
        console.log(`   • Pre-sale Items: ${preSaleItemCount.length}`);
        console.log('');

        // Show sample data
        console.log('👤 Users:');
        userCount.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        console.log('');
        console.log('🏢 Customers:');
        customerCount.slice(0, 3).forEach(customer => {
            console.log(`   - ${customer.name} (${customer.email}) - CPF: ${customer.cpf}`);
        });
        if (customerCount.length > 3) {
            console.log(`   ... and ${customerCount.length - 3} more`);
        }

        console.log('');
        console.log('📦 Products:');
        productCount.slice(0, 3).forEach(product => {
            console.log(`   - ${product.code}: ${product.name} - Stock: ${product.stock}`);
        });
        if (productCount.length > 3) {
            console.log(`   ... and ${productCount.length - 3} more`);
        }

        console.log('');
        console.log('💼 Pre-sales:');
        preSaleCount.forEach(preSale => {
            console.log(`   - Status: ${preSale.status} - Total: R$ ${preSale.total}`);
        });

        console.log('');
        console.log('✅ Data verification completed successfully!');

    } catch (error) {
        console.error('❌ Data verification failed:', error);
        process.exit(1);
    }
}

// Run verification if this file is executed directly
if (require.main === module) {
    verifySeededData()
        .then(() => {
            console.log('✅ Verification process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Verification process failed:', error);
            process.exit(1);
        });
}

export { verifySeededData };