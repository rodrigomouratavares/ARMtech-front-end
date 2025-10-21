-- Add permissions column to users table
ALTER TABLE users ADD COLUMN permissions JSON;

-- Update existing users with default permissions based on their role
UPDATE users 
SET permissions = CASE 
    WHEN role = 'admin' THEN '{"modules":{"products":true,"customers":true,"reports":true,"paymentMethods":true,"userManagement":true},"presales":{"canCreate":true,"canViewOwn":true,"canViewAll":true}}'::json
    WHEN role = 'manager' THEN '{"modules":{"products":true,"customers":true,"reports":true,"paymentMethods":false,"userManagement":false},"presales":{"canCreate":true,"canViewOwn":true,"canViewAll":true}}'::json
    ELSE '{"modules":{"products":true,"customers":true,"reports":false,"paymentMethods":false,"userManagement":false},"presales":{"canCreate":true,"canViewOwn":true,"canViewAll":false}}'::json
END
WHERE permissions IS NULL;