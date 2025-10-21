import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowcrm';
const client = new Client({ connectionString });
const db = drizzle(client);

async function debugReports() {
    try {
        console.log('🔍 Debugging reports data...\n');

        // Test basic connection
        console.log('1. Testing database connection...');
        await client.connect();
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Database connected:', result.rows[0].current_time);

        // Check payment methods
        console.log('\n2. Checking payment methods...');
        const paymentMethods = await client.query('SELECT * FROM payment_methods WHERE is_active = true');
        console.log(`✅ Found ${paymentMethods.rows.length} active payment methods:`);
        paymentMethods.rows.forEach(pm => {
            console.log(`   - ${pm.description} (${pm.code})`);
        });

        // Check presales
        console.log('\n3. Checking presales...');
        const presales = await client.query('SELECT * FROM presales ORDER BY created_at DESC LIMIT 10');
        console.log(`✅ Found ${presales.rows.length} presales (showing last 10):`);
        presales.rows.forEach(ps => {
            console.log(`   - ID: ${ps.id}, Status: ${ps.status}, Total: ${ps.total}, Created: ${ps.created_at}`);
        });

        // Check presales by status
        console.log('\n4. Checking presales by status...');
        const statusCounts = await client.query(`
            SELECT status, COUNT(*) as count, SUM(total::numeric) as total_amount
            FROM presales 
            GROUP BY status
            ORDER BY count DESC
        `);
        console.log('✅ Presales by status:');
        statusCounts.rows.forEach(sc => {
            console.log(`   - ${sc.status}: ${sc.count} presales, Total: R$ ${sc.total_amount || 0}`);
        });

        // Check presales table structure
        console.log('\n5. Checking presales table structure...');
        const presalesStructure = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'presales'
            ORDER BY ordinal_position
        `);
        console.log('✅ Presales table columns:');
        presalesStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check all tables to understand the structure
        console.log('\n6. Checking all tables...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('✅ Available tables:');
        tables.rows.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });

        // Check if there's a presale_items or similar table
        console.log('\n7. Checking for presale items or payment method relationships...');
        const presaleItemsCheck = await client.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns 
            WHERE table_name LIKE '%presale%' OR column_name LIKE '%payment%'
            ORDER BY table_name, ordinal_position
        `);
        console.log('✅ Tables/columns related to presales or payments:');
        presaleItemsCheck.rows.forEach(col => {
            console.log(`   - ${col.table_name}.${col.column_name}: ${col.data_type}`);
        });

        // Check date range of presales
        console.log('\n9. Checking date range of presales...');
        const dateRange = await client.query(`
            SELECT 
                MIN(created_at) as earliest,
                MAX(created_at) as latest,
                COUNT(*) as total_count
            FROM presales
        `);
        if (dateRange.rows[0].total_count > 0) {
            console.log(`✅ Presales date range:`);
            console.log(`   - Earliest: ${dateRange.rows[0].earliest}`);
            console.log(`   - Latest: ${dateRange.rows[0].latest}`);
            console.log(`   - Total count: ${dateRange.rows[0].total_count}`);
        } else {
            console.log('❌ No presales found in database');
        }

    } catch (error) {
        console.error('❌ Error debugging reports:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

debugReports();
// Check if payment_method_id column exists in presales table
console.log('\n8. Checking if payment_method_id exists in presales...');
const paymentMethodColumn = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'presales' AND column_name = 'payment_method_id'
        `);
if (paymentMethodColumn.rows.length > 0) {
    console.log('✅ payment_method_id column exists in presales table');

    // Check presales with payment methods
    const presalesWithPayments = await client.query(`
                SELECT 
                    ps.id,
                    ps.status,
                    ps.total,
                    ps.payment_method_id,
                    pm.description as payment_method
                FROM presales ps
                LEFT JOIN payment_methods pm ON ps.payment_method_id = pm.id
                WHERE ps.status = 'converted'
                ORDER BY ps.created_at DESC
                LIMIT 10
            `);
    console.log(`✅ Found ${presalesWithPayments.rows.length} converted presales:`);
    presalesWithPayments.rows.forEach(ps => {
        console.log(`   - ID: ${ps.id}, Total: ${ps.total}, Payment: ${ps.payment_method || 'NULL'}`);
    });
} else {
    console.log('❌ payment_method_id column does NOT exist in presales table');
    console.log('   This explains why the reports are showing zero values!');
}