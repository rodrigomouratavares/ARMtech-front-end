import 'dotenv/config';
import { db, checkDatabaseConnection } from './connection';
import { users } from './schema/users';
import { customers } from './schema/customers';
import { products } from './schema/products';
import { preSales, preSaleItems } from './schema/presales';
import { authService } from '../services/auth.service';
import { customerService } from '../services/customers.service';
import { productService } from '../services/products.service';
import { preSalesService } from '../services/presales.service';

/**
 * Database seeding script for development environment
 * Creates initial admin user and sample data for testing
 */

async function clearExistingData() {
    console.log('🧹 Clearing existing data...');

    // Delete in order to respect foreign key constraints
    await db.delete(preSaleItems);
    await db.delete(preSales);
    await db.delete(products);
    await db.delete(customers);
    await db.delete(users);

    console.log('✅ Existing data cleared');
}

async function createAdminUser() {
    console.log('👤 Creating admin user...');

    const adminUser = await authService.register({
        email: 'admin@flowcrm.com',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin'
    });

    console.log(`✅ Admin user created: ${adminUser.email} (ID: ${adminUser.id})`);
    return adminUser;
}

async function createSampleUsers() {
    console.log('👥 Creating sample users...');

    const manager = await authService.register({
        email: 'manager@flowcrm.com',
        password: 'manager123',
        name: 'Sales Manager',
        role: 'manager'
    });

    const employee = await authService.register({
        email: 'employee@flowcrm.com',
        password: 'employee123',
        name: 'Sales Employee',
        role: 'employee'
    });

    console.log(`✅ Sample users created: ${manager.email}, ${employee.email}`);
    return { manager, employee };
}

async function createSampleCustomers() {
    console.log('🏢 Creating sample customers...');

    const sampleCustomers = [
        {
            name: 'João Silva',
            email: 'joao.silva@empresa.com',
            phone: '(11) 99999-1111',
            cpf: '111.444.777-35', // Valid CPF
            address: 'Rua das Flores, 123 - São Paulo, SP'
        },
        {
            name: 'Maria Santos',
            email: 'maria.santos@comercio.com',
            phone: '(11) 88888-2222',
            cpf: '123.456.789-09', // Valid CPF
            address: 'Av. Paulista, 456 - São Paulo, SP'
        },
        {
            name: 'Pedro Oliveira',
            email: 'pedro.oliveira@industria.com',
            phone: '(11) 77777-3333',
            cpf: '987.654.321-00', // Valid CPF
            address: 'Rua do Comércio, 789 - São Paulo, SP'
        },
        {
            name: 'Ana Costa',
            email: 'ana.costa@servicos.com',
            phone: '(11) 66666-4444',
            cpf: '529.982.247-25', // Valid CPF
            address: 'Alameda Santos, 321 - São Paulo, SP'
        },
        {
            name: 'Carlos Ferreira',
            email: 'carlos.ferreira@tecnologia.com',
            phone: '(11) 55555-5555',
            cpf: '390.533.447-05', // Valid CPF
            address: 'Rua da Tecnologia, 654 - São Paulo, SP'
        }
    ];

    const createdCustomers = [];
    for (const customerData of sampleCustomers) {
        const customer = await customerService.create(customerData);
        createdCustomers.push(customer);
    }

    console.log(`✅ ${createdCustomers.length} sample customers created`);
    return createdCustomers;
}

async function createSampleProducts() {
    console.log('📦 Creating sample products...');

    const sampleProducts = [
        {
            code: 'NB001',
            name: 'Notebook Dell Inspiron 15',
            unit: 'UN',
            description: 'Notebook Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, 256GB SSD',
            stock: 15,
            purchasePrice: '1800.00',
            salePrice: '2500.00',
            saleType: 'retail'
        },
        {
            code: 'MS001',
            name: 'Mouse Logitech MX Master 3',
            unit: 'UN',
            description: 'Mouse sem fio Logitech MX Master 3, sensor Darkfield, 7 botões',
            stock: 50,
            purchasePrice: '250.00',
            salePrice: '350.00',
            saleType: 'retail'
        },
        {
            code: 'KB001',
            name: 'Teclado Mecânico Corsair K95',
            unit: 'UN',
            description: 'Teclado mecânico Corsair K95 RGB Platinum, switches Cherry MX',
            stock: 25,
            purchasePrice: '400.00',
            salePrice: '600.00',
            saleType: 'retail'
        },
        {
            code: 'MON001',
            name: 'Monitor LG UltraWide 29"',
            unit: 'UN',
            description: 'Monitor LG 29WP60G-B UltraWide 29", Full HD, IPS',
            stock: 12,
            purchasePrice: '800.00',
            salePrice: '1200.00',
            saleType: 'retail'
        },
        {
            code: 'HD001',
            name: 'HD Externo Seagate 2TB',
            unit: 'UN',
            description: 'HD Externo Seagate Expansion 2TB, USB 3.0, Portátil',
            stock: 30,
            purchasePrice: '200.00',
            salePrice: '300.00',
            saleType: 'retail'
        },
        {
            code: 'CAB001',
            name: 'Cabo HDMI Premium 2m',
            unit: 'UN',
            description: 'Cabo HDMI 2.1 Premium Speed, 2 metros, 4K 120Hz',
            stock: 100,
            purchasePrice: '15.00',
            salePrice: '35.00',
            saleType: 'wholesale'
        }
    ];

    const createdProducts = [];
    for (const productData of sampleProducts) {
        const product = await productService.create(productData);
        createdProducts.push(product);
    }

    console.log(`✅ ${createdProducts.length} sample products created`);
    return createdProducts;
}

async function createSamplePreSales(customers: any[], products: any[]) {
    console.log('💼 Creating sample pre-sales...');

    const samplePreSales = [
        {
            customerId: customers[0].id, // João Silva
            status: 'draft' as const,
            notes: 'Orçamento para setup completo de escritório',
            items: [
                {
                    productId: products[0].id, // Notebook Dell
                    quantity: '2',
                    unitPrice: '2500.00',
                    discount: '200.00'
                },
                {
                    productId: products[1].id, // Mouse Logitech
                    quantity: '2',
                    unitPrice: '350.00',
                    discount: '0.00'
                }
            ]
        },
        {
            customerId: customers[1].id, // Maria Santos
            status: 'pending' as const,
            notes: 'Equipamentos para nova filial',
            items: [
                {
                    productId: products[3].id, // Monitor LG
                    quantity: '5',
                    unitPrice: '1200.00',
                    discount: '300.00'
                },
                {
                    productId: products[2].id, // Teclado Corsair
                    quantity: '5',
                    unitPrice: '600.00',
                    discount: '150.00'
                }
            ]
        },
        {
            customerId: customers[2].id, // Pedro Oliveira
            status: 'approved' as const,
            notes: 'Backup e armazenamento para servidor',
            items: [
                {
                    productId: products[4].id, // HD Externo
                    quantity: '10',
                    unitPrice: '300.00',
                    discount: '100.00'
                },
                {
                    productId: products[5].id, // Cabo HDMI
                    quantity: '20',
                    unitPrice: '35.00',
                    discount: '50.00'
                }
            ]
        }
    ];

    const createdPreSales = [];
    for (const preSaleData of samplePreSales) {
        const preSale = await preSalesService.create(preSaleData);
        createdPreSales.push(preSale);
    }

    console.log(`✅ ${createdPreSales.length} sample pre-sales created`);
    return createdPreSales;
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    console.log('=====================================');

    try {
        // Check database connection
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
            throw new Error('Database connection failed');
        }
        console.log('✅ Database connection verified');

        // Clear existing data
        await clearExistingData();

        // Create users
        await createAdminUser();
        await createSampleUsers();

        // Create sample data
        const customers = await createSampleCustomers();
        const products = await createSampleProducts();
        const preSales = await createSamplePreSales(customers, products);

        console.log('=====================================');
        console.log('🎉 Database seeding completed successfully!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   • Users: 3 (1 admin, 1 manager, 1 employee)`);
        console.log(`   • Customers: ${customers.length}`);
        console.log(`   • Products: ${products.length}`);
        console.log(`   • Pre-sales: ${preSales.length}`);
        console.log('');
        console.log('🔑 Login credentials:');
        console.log('   • Admin: admin@flowcrm.com / admin123');
        console.log('   • Manager: manager@flowcrm.com / manager123');
        console.log('   • Employee: employee@flowcrm.com / employee123');
        console.log('');

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('✅ Seeding process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding process failed:', error);
            process.exit(1);
        });
}

export { seedDatabase };