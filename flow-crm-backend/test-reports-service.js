import { simpleReportsService } from './src/services/reports.service.simple.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testReportsService() {
    try {
        console.log('🧪 Testing Reports Service...\n');

        // Test database connectivity
        console.log('1. Testing database connectivity...');
        const dbTest = await simpleReportsService.testDatabase();
        console.log('Database test result:', dbTest);

        // Test payment methods report
        console.log('\n2. Testing payment methods report...');
        const paymentMethodsReport = await simpleReportsService.getPaymentMethodsReport();
        console.log(`✅ Found ${paymentMethodsReport.length} payment methods in report:`);

        paymentMethodsReport.forEach(pm => {
            console.log(`   - ${pm.paymentMethod.description}: ${pm.salesCount} sales, R$ ${pm.totalAmount}`);
        });

        // Test report summary
        console.log('\n3. Testing report summary...');
        const summary = await simpleReportsService.getReportSummary();
        console.log('✅ Report summary:');
        console.log(`   - Total Amount: R$ ${summary.totalAmount}`);
        console.log(`   - Total Sales: ${summary.totalSalesCount}`);
        console.log(`   - Converted Presales: ${summary.totalConvertedPresales}`);
        console.log(`   - Period: ${summary.period.startDate} to ${summary.period.endDate}`);

        // Test with date filter
        console.log('\n4. Testing with date filter (last 7 days)...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const filteredReport = await simpleReportsService.getPaymentMethodsReport({
            dateRange: {
                startDate: sevenDaysAgo,
                endDate: new Date()
            }
        });

        console.log(`✅ Found ${filteredReport.length} payment methods in filtered report:`);
        filteredReport.forEach(pm => {
            console.log(`   - ${pm.paymentMethod.description}: ${pm.salesCount} sales, R$ ${pm.totalAmount}`);
        });

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Error testing reports service:', error);
    } finally {
        process.exit(0);
    }
}

testReportsService();