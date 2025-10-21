import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowcrm';
const client = new Client({ connectionString });

async function updatePresalesPaymentMethods() {
    try {
        console.log('🔧 Updating existing presales with payment methods...\n');

        await client.connect();

        // Get all active payment methods
        const paymentMethods = await client.query(`
            SELECT id, code, description 
            FROM payment_methods 
            WHERE is_active = true 
            ORDER BY code
        `);

        console.log(`✅ Found ${paymentMethods.rows.length} active payment methods:`);
        paymentMethods.rows.forEach(pm => {
            console.log(`   - ${pm.description} (${pm.code})`);
        });

        // Get presales without payment methods
        const presalesWithoutPayment = await client.query(`
            SELECT id, status, total, created_at
            FROM presales 
            WHERE payment_method_id IS NULL
            ORDER BY created_at DESC
        `);

        console.log(`\n📊 Found ${presalesWithoutPayment.rows.length} presales without payment methods`);

        if (presalesWithoutPayment.rows.length === 0) {
            console.log('✅ All presales already have payment methods assigned');
            return;
        }

        // Strategy: Distribute presales among payment methods based on realistic patterns
        // PIX (40%), Cartão de Crédito (30%), Cartão de Débito (20%), Dinheiro (10%)
        const paymentDistribution = [
            { method: 'PM0002', percentage: 0.40 }, // PIX
            { method: 'PM0001', percentage: 0.30 }, // Cartão de Crédito  
            { method: 'PM0006', percentage: 0.20 }, // Cartão de Débito
            { method: 'PM0003', percentage: 0.10 }  // Dinheiro
        ];

        // Get payment method IDs
        const paymentMethodMap = {};
        for (const pm of paymentMethods.rows) {
            paymentMethodMap[pm.code] = pm.id;
        }

        console.log('\n🎯 Assigning payment methods to presales...');

        let updatedCount = 0;
        for (let i = 0; i < presalesWithoutPayment.rows.length; i++) {
            const presale = presalesWithoutPayment.rows[i];

            // Determine payment method based on distribution
            let cumulativePercentage = 0;
            const random = Math.random();
            let selectedPaymentMethod = null;

            for (const dist of paymentDistribution) {
                cumulativePercentage += dist.percentage;
                if (random <= cumulativePercentage) {
                    selectedPaymentMethod = paymentMethodMap[dist.method];
                    break;
                }
            }

            // Fallback to PIX if something goes wrong
            if (!selectedPaymentMethod) {
                selectedPaymentMethod = paymentMethodMap['PM0002'];
            }

            // Update the presale
            await client.query(`
                UPDATE presales 
                SET payment_method_id = $1 
                WHERE id = $2
            `, [selectedPaymentMethod, presale.id]);

            updatedCount++;

            // Get payment method name for logging
            const pmName = paymentMethods.rows.find(pm => pm.id === selectedPaymentMethod)?.description || 'Unknown';
            console.log(`   ✅ Updated presale ${presale.id.substring(0, 8)}... (${presale.status}, R$ ${presale.total}) -> ${pmName}`);
        }

        console.log(`\n🎉 Successfully updated ${updatedCount} presales with payment methods!`);

        // Verify the update
        console.log('\n🔍 Verifying updates...');
        const verificationQuery = await client.query(`
            SELECT 
                pm.description as payment_method,
                pm.code,
                COUNT(ps.id) as presale_count,
                SUM(ps.total::numeric) as total_amount
            FROM presales ps
            INNER JOIN payment_methods pm ON ps.payment_method_id = pm.id
            WHERE ps.status = 'converted'
            GROUP BY pm.id, pm.description, pm.code
            ORDER BY total_amount DESC
        `);

        console.log('✅ Converted presales by payment method:');
        verificationQuery.rows.forEach(row => {
            console.log(`   - ${row.payment_method} (${row.code}): ${row.presale_count} presales, R$ ${row.total_amount}`);
        });

        // Check for any remaining NULL values
        const remainingNulls = await client.query(`
            SELECT COUNT(*) as count 
            FROM presales 
            WHERE payment_method_id IS NULL
        `);

        if (remainingNulls.rows[0].count > 0) {
            console.log(`\n⚠️  Warning: ${remainingNulls.rows[0].count} presales still have NULL payment_method_id`);
        } else {
            console.log('\n✅ All presales now have payment methods assigned!');
        }

    } catch (error) {
        console.error('❌ Error updating presales payment methods:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

updatePresalesPaymentMethods();