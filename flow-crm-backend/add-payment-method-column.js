import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowcrm';
const client = new Client({ connectionString });

async function addPaymentMethodColumn() {
    try {
        console.log('🔧 Adding payment_method_id column to presales table...\n');

        await client.connect();

        // Check if column already exists
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'presales' AND column_name = 'payment_method_id'
        `);

        if (columnCheck.rows.length > 0) {
            console.log('✅ payment_method_id column already exists');
        } else {
            console.log('➕ Adding payment_method_id column...');

            // Add the column
            await client.query('ALTER TABLE "presales" ADD COLUMN "payment_method_id" uuid');
            console.log('✅ Column added successfully');

            // Add foreign key constraint
            console.log('🔗 Adding foreign key constraint...');
            await client.query(`
                ALTER TABLE "presales" 
                ADD CONSTRAINT "presales_payment_method_id_payment_methods_id_fk" 
                FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") 
                ON DELETE no action ON UPDATE no action
            `);
            console.log('✅ Foreign key constraint added');

            // Add indexes
            console.log('📊 Adding indexes for performance...');
            const indexes = [
                'CREATE INDEX IF NOT EXISTS "idx_presales_status" ON "presales" ("status")',
                'CREATE INDEX IF NOT EXISTS "idx_presales_payment_method_id" ON "presales" ("payment_method_id")',
                'CREATE INDEX IF NOT EXISTS "idx_presales_created_at" ON "presales" ("created_at")',
                'CREATE INDEX IF NOT EXISTS "idx_presales_status_payment_method" ON "presales" ("status", "payment_method_id")',
                'CREATE INDEX IF NOT EXISTS "idx_presales_status_created_at" ON "presales" ("status", "created_at")',
                'CREATE INDEX IF NOT EXISTS "idx_presales_payment_method_created_at" ON "presales" ("payment_method_id", "created_at")',
                'CREATE INDEX IF NOT EXISTS "idx_presales_reports" ON "presales" ("status", "payment_method_id", "created_at")'
            ];

            for (const indexSql of indexes) {
                await client.query(indexSql);
            }
            console.log('✅ Indexes created successfully');
        }

        // Verify the column was added
        console.log('\n🔍 Verifying column structure...');
        const finalCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'presales' AND column_name = 'payment_method_id'
        `);

        if (finalCheck.rows.length > 0) {
            const col = finalCheck.rows[0];
            console.log(`✅ payment_method_id: ${col.data_type} (nullable: ${col.is_nullable})`);
        } else {
            console.log('❌ Column was not created successfully');
        }

    } catch (error) {
        console.error('❌ Error adding payment_method_id column:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

addPaymentMethodColumn();