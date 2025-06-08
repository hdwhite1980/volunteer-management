-- SQL Migration Script to Create Categories Table and Insert New Categories
-- This script creates a categories table and populates it with your new volunteer categories

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    category_type VARCHAR(50) NOT NULL, -- 'volunteer' or 'requester'
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_categories_updated_at ON job_categories;
CREATE TRIGGER update_job_categories_updated_at
    BEFORE UPDATE ON job_categories
    FOR EACH ROW EXECUTE FUNCTION update_categories_updated_at();

-- Clear existing categories (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE job_categories RESTART IDENTITY CASCADE;

-- Insert Volunteer Categories
INSERT INTO job_categories (category_name, category_type, description, display_order) VALUES
('Debris Removal & Cleanup', 'volunteer', 'Help remove storm debris, fallen trees, and damaged materials from properties and public areas', 1),
('Structural Assessment & Repair', 'volunteer', 'Assist with evaluating and repairing structural damage to buildings and homes', 2),
('Home Stabilization (e.g., tarping, boarding)', 'volunteer', 'Install temporary protective measures like roof tarps and board up windows to prevent further damage', 3),
('Utility Restoration Support', 'volunteer', 'Support efforts to restore electricity, water, gas, and other essential utilities', 4),
('Supply Distribution', 'volunteer', 'Help distribute food, water, clothing, and other essential supplies to affected individuals', 5),
('Warehouse Management', 'volunteer', 'Organize, sort, and manage donated goods and supplies in storage facilities', 6),
('Transportation Assistance', 'volunteer', 'Provide transportation for people, supplies, or equipment during disaster response', 7),
('Administrative & Office Support', 'volunteer', 'Assist with data entry, phone calls, paperwork, and other administrative tasks', 8),
('First Aid & Medical Support', 'volunteer', 'Provide basic medical care and first aid services (requires appropriate certification)', 9),
('Mental Health & Emotional Support', 'volunteer', 'Offer counseling, emotional support, and psychological first aid to disaster survivors', 10),
('Spiritual Care', 'volunteer', 'Provide spiritual comfort, prayer support, and faith-based assistance', 11),
('Pet Care Services', 'volunteer', 'Care for displaced, lost, or injured pets and assist with animal rescue efforts', 12),
('Childcare & Youth Programs', 'volunteer', 'Provide childcare, educational activities, and support programs for children', 13),
('Senior Assistance', 'volunteer', 'Help elderly residents with specific needs including medication, mobility, and daily tasks', 14),
('Multilingual & Translation Support', 'volunteer', 'Provide translation and interpretation services for non-English speaking individuals', 15),
('Legal Aid Assistance', 'volunteer', 'Help with legal documentation, insurance claims, and FEMA applications', 16),
('Volunteer Coordination', 'volunteer', 'Organize and manage volunteer teams, schedules, and assignments', 17),
('IT & Communication Support', 'volunteer', 'Set up and maintain communication systems, networks, and technical infrastructure', 18),
('Damage Assessment & Reporting', 'volunteer', 'Document and assess property damage for insurance and aid purposes', 19),
('Fundraising & Community Outreach', 'volunteer', 'Organize fundraising events and community awareness campaigns', 20)
ON CONFLICT (category_name) DO UPDATE 
SET 
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at = CURRENT_TIMESTAMP;

-- Insert Requester Help Categories (for future use)
INSERT INTO job_categories (category_name, category_type, description, display_order) VALUES
('Need Debris Cleanup', 'requester', 'Request help removing debris from your property', 21),
('Need Roof Tarping / Emergency Repairs', 'requester', 'Request emergency roof covering or temporary repairs', 22),
('Need Structural Assessment', 'requester', 'Request professional assessment of structural damage', 23),
('Need Minor Home Repairs', 'requester', 'Request help with small repairs like fixing doors, windows, or walls', 24),
('Need Food Assistance', 'requester', 'Request food supplies or meal assistance', 25),
('Need Water or Hydration Supplies', 'requester', 'Request drinking water or hydration supplies', 26),
('Need Clothing or Shoes', 'requester', 'Request clothing, shoes, or personal items', 27),
('Need Hygiene or Sanitation Items', 'requester', 'Request hygiene products, toiletries, or sanitation supplies', 28),
('Need Pet Food / Pet Supplies', 'requester', 'Request food or supplies for pets', 29),
('Need Transportation / Ride to Shelter', 'requester', 'Request transportation to shelters, medical facilities, or other locations', 30),
('Need Delivery of Supplies', 'requester', 'Request delivery of essential supplies to your location', 31),
('Need Vehicle Help (e.g., jumpstart)', 'requester', 'Request help with vehicle issues like battery jump or tire change', 32),
('Need First Aid / Medical Check-In', 'requester', 'Request basic medical attention or wellness check', 33),
('Need Mental Health Support', 'requester', 'Request counseling or emotional support services', 34),
('Need Medication Refill or Replacement', 'requester', 'Request help obtaining prescription medications', 35),
('Need Childcare Support', 'requester', 'Request temporary childcare or youth activities', 36),
('Need Elderly Assistance', 'requester', 'Request help for elderly family members', 37),
('Need Disability Support', 'requester', 'Request assistance for individuals with disabilities', 38),
('Need Translation / Interpretation Help', 'requester', 'Request language translation or interpretation services', 39),
('Need Help Applying for FEMA or Other Aid', 'requester', 'Request assistance with disaster aid applications', 40),
('Need Help Filing Insurance Claims', 'requester', 'Request help with insurance paperwork and claims', 41),
('Need Help Replacing Lost Documents', 'requester', 'Request assistance replacing important documents', 42),
('Need Emergency Shelter', 'requester', 'Request information about or transportation to emergency shelters', 43),
('Need Generator or Charging Station', 'requester', 'Request access to power for essential devices', 44),
('Need Heating or Cooling Relief', 'requester', 'Request help with temperature control or relief centers', 45),
('Need Internet or Hotspot Access', 'requester', 'Request internet access for communication or work', 46),
('Need Help Filling Online Forms', 'requester', 'Request assistance with online applications or forms', 47)
ON CONFLICT (category_name) DO UPDATE 
SET 
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at = CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_categories_type ON job_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_job_categories_active ON job_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_job_categories_order ON job_categories(display_order);

-- Create a view for active volunteer categories
CREATE OR REPLACE VIEW active_volunteer_categories AS
SELECT 
    id,
    category_name,
    description,
    display_order
FROM job_categories
WHERE category_type = 'volunteer' 
  AND is_active = TRUE
ORDER BY display_order;

-- Create a view for active requester categories
CREATE OR REPLACE VIEW active_requester_categories AS
SELECT 
    id,
    category_name,
    description,
    display_order
FROM job_categories
WHERE category_type = 'requester' 
  AND is_active = TRUE
ORDER BY display_order;

-- Add foreign key constraint to jobs table (if it exists)
-- This ensures jobs can only use valid categories
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        -- First, add a category_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'jobs' AND column_name = 'category_id') THEN
            ALTER TABLE jobs ADD COLUMN category_id INTEGER;
        END IF;
        
        -- Update category_id based on category name
        UPDATE jobs j
        SET category_id = jc.id
        FROM job_categories jc
        WHERE j.category = jc.category_name;
        
        -- Add foreign key constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_jobs_category') THEN
            ALTER TABLE jobs 
            ADD CONSTRAINT fk_jobs_category 
            FOREIGN KEY (category_id) 
            REFERENCES job_categories(id);
        END IF;
    END IF;
END $$;

-- Verify the migration
SELECT 
    category_type,
    COUNT(*) as category_count
FROM job_categories
GROUP BY category_type;

SELECT 
    category_name,
    category_type,
    display_order
FROM job_categories
ORDER BY category_type, display_order
LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Categories migration completed successfully!';
    RAISE NOTICE 'Created % volunteer categories and % requester categories',
        (SELECT COUNT(*) FROM job_categories WHERE category_type = 'volunteer'),
        (SELECT COUNT(*) FROM job_categories WHERE category_type = 'requester');
END $$;