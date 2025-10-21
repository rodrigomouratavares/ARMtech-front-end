# Database Seeding

This directory contains scripts for database seeding and data management.

## Available Scripts

### `npm run db:seed`
Seeds the database with initial data for development and testing:

- **Admin User**: Creates a system administrator account
- **Sample Users**: Creates manager and employee accounts with different roles
- **Sample Customers**: Creates 5 customers with valid CPF numbers
- **Sample Products**: Creates 6 products across different categories
- **Sample Pre-sales**: Creates 3 pre-sales with different statuses and items

### `npm run db:verify`
Verifies the seeded data by displaying counts and sample records from each table.

### `npm run db:migrate`
Runs database migrations to create/update table structure.

## Seeded Data Details

### Users
- **Admin**: admin@flowcrm.com / admin123 (role: admin)
- **Manager**: manager@flowcrm.com / manager123 (role: manager)  
- **Employee**: employee@flowcrm.com / employee123 (role: employee)

### Customers
5 sample customers with:
- Valid Brazilian CPF numbers
- Complete contact information
- Realistic business addresses in São Paulo

### Products
6 sample products including:
- Electronics (notebooks, monitors, peripherals)
- Different sale types (retail/wholesale)
- Realistic pricing and stock levels
- Unique product codes

### Pre-sales
3 sample pre-sales demonstrating:
- Different statuses (draft, pending, approved)
- Multiple items per pre-sale
- Discount calculations
- Customer relationships

## Usage

1. **First-time setup**: Run migrations then seed
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

2. **Reset data**: The seed script clears existing data before creating new records
   ```bash
   npm run db:seed
   ```

3. **Verify data**: Check what's in the database
   ```bash
   npm run db:verify
   ```

## Development Notes

- The seed script respects foreign key constraints by deleting in proper order
- All CPF numbers used are mathematically valid
- Passwords are properly hashed using bcrypt
- Sample data is realistic and suitable for testing all system features
- The script can be run multiple times safely (clears existing data first)

## Requirements Satisfied

This seeding implementation satisfies the following requirements:

- **Requirement 3.7**: Creates initial admin user for system access
- **Requirement 4.6**: Provides sample data for development and testing
- Creates comprehensive test data covering all major entities
- Enables immediate testing of all API endpoints with realistic data