export const initialVenues = [
  { id: 'v1', name: 'Royal Grand Ballroom', capacity: 500, price: 150000, address: 'S.G. Highway, Ahmedabad', venueCode: 'VN-RGB-01', contactPerson: 'Mr. Arvind Saxena', contactNumber: '+91 98250 11223', email: 'royalballroom@venues.com', type: 'Grand Ballroom', notes: 'Pillar-less banquet with centralized AC', active: true, assignedSalesPerson: '' },
  { id: 'v2', name: 'Lakeside Pavilion', capacity: 300, price: 120000, address: 'Kankaria Lake, Ahmedabad', venueCode: 'VN-LKP-02', contactPerson: 'Sanjay Rawal', contactNumber: '+91 98250 33445', email: 'lakeside@venues.com', type: 'Open Air Pavilion', notes: 'Lake view stage setup with lawn', active: true, assignedSalesPerson: 'sales' },
  { id: 'v3', name: 'Garden Terrace & Lawn', capacity: 800, price: 200000, address: 'Bodakdev, Ahmedabad', venueCode: 'VN-GTL-03', contactPerson: 'Meera Trivedi', contactNumber: '+91 98250 55667', email: 'gardenterrace@venues.com', type: 'Lawn & Terrace', notes: 'Suitable for mega receptions and buffets', active: true, assignedSalesPerson: 'admin' },
  { id: 'v4', name: 'Elite Banquet Hall', capacity: 150, price: 75000, address: 'C.G. Road, Ahmedabad', venueCode: 'VN-EBH-04', contactPerson: 'Karan Shah', contactNumber: '+91 98250 77889', email: 'elitehall@venues.com', type: 'Compact Hall', notes: 'Ideal for Micro Events & intimate gatherings', active: true, assignedSalesPerson: '' }
];

export const initialRawMaterials = [
  { id: 'rm1', name: 'Basmati Rice', category: 'Grocery', unit: 'kg', costPerUnit: 90 },
  { id: 'rm2', name: 'Wheat Flour (Atta)', category: 'Grocery', unit: 'kg', costPerUnit: 45 },
  { id: 'rm3', name: 'Sugar', category: 'Grocery', unit: 'kg', costPerUnit: 40 },
  { id: 'rm4', name: 'Spices Mix', category: 'Grocery', unit: 'kg', costPerUnit: 350 },
  { id: 'rm5', name: 'Cooking Oil', category: 'Grocery', unit: 'ltr', costPerUnit: 140 },
  { id: 'rm6', name: 'Lentils (Dal)', category: 'Grocery', unit: 'kg', costPerUnit: 120 },
  { id: 'rm7', name: 'Tea Leaves', category: 'Grocery', unit: 'kg', costPerUnit: 280 },
  { id: 'rm8', name: 'Chinese Sauces', category: 'Grocery', unit: 'ltr', costPerUnit: 95 },
  { id: 'rm9', name: 'Fresh Paneer', category: 'Dairy', unit: 'kg', costPerUnit: 380 },
  { id: 'rm10', name: 'Amul Butter', category: 'Dairy', unit: 'kg', costPerUnit: 520 },
  { id: 'rm11', name: 'Fresh Cream', category: 'Dairy', unit: 'ltr', costPerUnit: 220 },
  { id: 'rm12', name: 'Full Cream Milk', category: 'Dairy', unit: 'ltr', costPerUnit: 66 },
  { id: 'rm13', name: 'Khoya (Mawa)', category: 'Dairy', unit: 'kg', costPerUnit: 320 },
  { id: 'rm14', name: 'Desi Ghee', category: 'Dairy', unit: 'kg', costPerUnit: 650 },
  { id: 'rm15', name: 'Mixed Vegetables', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 50 },
  { id: 'rm16', name: 'Onions & Potatoes', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 35 },
  { id: 'rm17', name: 'Capsicum & Tomato', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 60 },
  { id: 'rm18', name: 'Mint & Lemon', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 80 },
  { id: 'rm19', name: 'Assorted Fresh Fruits', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 120 },
  { id: 'rm20', name: 'LPG Commercial Cylinder', category: 'Fuel', unit: 'cylinder', costPerUnit: 1850 },
  { id: 'rm21', name: 'Charcoal / Wood', category: 'Fuel', unit: 'bag', costPerUnit: 450 }
];

import masterMenuData from '../data/catering_master_menu.json' with { type: 'json' };

export const masterMenuCategories = [
  'Beverages & Welcome Drinks',
  'Appetizers, Chaats & Street Food',
  'Global & Fusion Cuisines',
  'South Indian Specialties',
  'North Indian Specialties',
  'Sides, Accompaniments & Salads',
  'Desserts, Sweets & Ice Creams',
  'After-Meal / Traditional Finishers'
];

export const initialDishes = Array.isArray(masterMenuData)
  ? masterMenuData.map(item => ({
      id: item.id || item._id,
      _id: item._id || item.id,
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      price: item.price,
      dietary: item.dietary || ['Vegetarian'],
      recipe: item.recipe || []
    }))
  : (masterMenuData.categories || []).flatMap(cat =>
      (cat.subCategories || []).flatMap(sub =>
        (sub.items || []).map(item => ({
          id: item.id || item._id,
          _id: item._id || item.id,
          name: item.name,
          category: item.category || cat.name,
          subCategory: item.subCategory || sub.name,
          price: item.price,
          dietary: item.dietary || ['Vegetarian'],
          recipe: item.recipe || []
        }))
      )
    );

export const initialSuppliers = [
  { id: 's1', name: 'Krishna Grocery Wholesalers', category: 'Grocery', subCategory: 'Rice & Grains', contact: 'Ramesh Patel', phone: '+91 98765 43210', address: 'APMC Market Yard, Bangalore', email: 'krishna.grocery@gmail.com', status: 'Active', notes: 'Primary basmati rice and dal supplier', active: true },
  { id: 's2', name: 'Amul Dairy Distributors', category: 'Dairy', subCategory: 'Paneer & Butter', contact: 'Suresh Shah', phone: '+91 98250 12345', address: 'Dairy Circle, Bangalore', email: 'amul.dist@gmail.com', status: 'Active', notes: 'Fresh paneer and Amul butter daily batch', active: true },
  { id: 's3', name: 'Green Market Fresh Produce', category: 'Vegetables', subCategory: 'Country Vegetables', contact: 'Vijay Khetan', phone: '+91 99099 87654', address: 'K.R. Market, Bangalore', email: 'greenmarket@gmail.com', status: 'Active', notes: 'Fresh vegetable delivery at 4:30 AM', active: true },
  { id: 's4', name: 'HP Commercial Gas Corp', category: 'Cylinders', subCategory: '19kg Commercial LPG', contact: 'Dinesh Mehta', phone: '+91 97243 55566', address: 'Industrial Area, Bangalore', email: 'hpgas.corp@gmail.com', status: 'Active', notes: 'Commercial 19kg refill logistics', active: true },
  { id: 's5', name: 'Kaveri Tender Coconut Farms', category: 'Coconut', subCategory: 'Tender Coconut', contact: 'Muthuswamy', phone: '+91 98450 67890', address: 'Maddur, Karnataka', email: 'kaveri.coconuts@gmail.com', status: 'Active', notes: 'Fresh sweet tender coconuts on site', active: true },
  { id: 's6', name: 'Sri Balaji Thambula Mart', category: 'Thambula', subCategory: 'Cloth Thambula', contact: 'Narayana Murthy', phone: '+91 98451 12344', address: 'Chickpet, Bangalore', email: 'balaji.thambula@gmail.com', status: 'Active', notes: 'Cloth and jute return gift bags', active: true }
];

export const initialLaborRates = [
  { id: 'l1', type: 'Captain/Supervisor', rate: 1400 },
  { id: 'l2', type: 'Waiter / Service Staff', rate: 900 },
  { id: 'l3', type: 'Bartender / Mixologist', rate: 1600 },
  { id: 'l4', type: 'Kitchen Helper', rate: 750 },
  { id: 'l5', type: 'Utility Cleaner', rate: 650 }
];

export const initialAgencies = [
  { id: 'a1', name: 'Royal Hospitality Services', contact: 'Harsh Vyas', phone: '+91 98111 22233', categories: ['Waiter / Service Staff', 'Captain/Supervisor'] },
  { id: 'a2', name: 'Apex Event Staffing Co', contact: 'Nikhil Parmar', phone: '+91 98980 44455', categories: ['Bartender / Mixologist', 'Kitchen Helper', 'Utility Cleaner'] }
];

export const initialVessels = [
  { id: 'ves_1', name: 'Aluminium Degchi (100 Litre)', category: 'Cooking Vessel', totalQty: 15, availableQty: 12, inUseQty: 3, damagedQty: 0, location: 'Kitchen Store A', valuePerUnit: 8500, photo: '', itemCode: 'VES-DEG-100', minStock: 5 },
  { id: 'ves_2', name: 'Brass Biryani Handi (50L)', category: 'Cooking Vessel', totalQty: 10, availableQty: 8, inUseQty: 2, damagedQty: 0, location: 'Kitchen Store A', valuePerUnit: 12000, photo: '', itemCode: 'VES-HND-050', minStock: 3 },
  { id: 'ves_3', name: 'Stainless Steel Kadai (Big)', category: 'Cooking Vessel', totalQty: 18, availableQty: 15, inUseQty: 3, damagedQty: 0, location: 'Kitchen Store B', valuePerUnit: 4500, photo: '', itemCode: 'VES-KAD-001', minStock: 5 },
  { id: 'ves_4', name: 'Chafing Dishes Roll-Top Set', category: 'Serving Gear', totalQty: 45, availableQty: 35, inUseQty: 10, damagedQty: 0, location: 'Banquet Store', valuePerUnit: 3200, photo: '', itemCode: 'VES-CHF-002', minStock: 10 },
  { id: 'ves_5', name: 'Thermal Hot Transport Boxes (80L)', category: 'Serving Gear', totalQty: 25, availableQty: 20, inUseQty: 5, damagedQty: 0, location: 'Logistics Bay', valuePerUnit: 6500, photo: '', itemCode: 'VES-THR-080', minStock: 8 },
  { id: 'ves_6', name: 'Royal Melamine Dinner Plates (Set of 100)', category: 'Utensils', totalQty: 25, availableQty: 22, inUseQty: 3, damagedQty: 0, location: 'Crockery Rack', valuePerUnit: 4800, photo: '', itemCode: 'VES-PLT-100', minStock: 10 },
  { id: 'ves_7', name: 'Commercial 3-Burner Gas Stove', category: 'Heating & Fuel', totalQty: 8, availableQty: 6, inUseQty: 2, damagedQty: 0, location: 'Kitchen Store B', valuePerUnit: 14500, photo: '', itemCode: 'VES-STV-003', minStock: 2 }
];

export const initialProvisions = [
  { id: 'prv_1', name: 'Royal Aged Basmati Rice', category: 'Grocery', unit: 'kg', stockQty: 650, reorderLevel: 150, costPerUnit: 110, supplierId: 's1', photo: '', itemCode: 'PRV-RIC-001' },
  { id: 'prv_2', name: 'Premium Whole Wheat Atta', category: 'Grocery', unit: 'kg', stockQty: 400, reorderLevel: 100, costPerUnit: 45, supplierId: 's1', photo: '', itemCode: 'PRV-ATT-002' },
  { id: 'prv_3', name: 'Pure Cow Desi Ghee', category: 'Ghee & Oils', unit: 'kg', stockQty: 120, reorderLevel: 30, costPerUnit: 650, supplierId: 's2', photo: '', itemCode: 'PRV-GHE-003' },
  { id: 'prv_4', name: 'Refined Groundnut Oil', category: 'Ghee & Oils', unit: 'ltr', stockQty: 350, reorderLevel: 75, costPerUnit: 145, supplierId: 's1', photo: '', itemCode: 'PRV-OIL-004' },
  { id: 'prv_5', name: 'Shahi Garam Masala Blend', category: 'Spices & Condiments', unit: 'kg', stockQty: 25, reorderLevel: 8, costPerUnit: 420, supplierId: 's1', photo: '', itemCode: 'PRV-SPM-005' },
  { id: 'prv_6', name: 'Almonds & Cashew Nuts Mix', category: 'Dry Fruits', unit: 'kg', stockQty: 50, reorderLevel: 15, costPerUnit: 850, supplierId: 's1', photo: '', itemCode: 'PRV-DRF-006' }
];

export const initialVegetables = [
  { id: 'veg_1', name: 'Nashik Red Onions', category: 'Vegetable', unit: 'kg', stockQty: 350, marketPrice: 35, freshnessStatus: 'Fresh', supplierId: 's3' },
  { id: 'veg_2', name: 'Fresh Farm Potatoes', category: 'Vegetable', unit: 'kg', stockQty: 400, marketPrice: 30, freshnessStatus: 'Fresh', supplierId: 's3' },
  { id: 'veg_3', name: 'Hybrid Tomatoes', category: 'Vegetable', unit: 'kg', stockQty: 180, marketPrice: 55, freshnessStatus: 'Fresh', supplierId: 's3' },
  { id: 'veg_4', name: 'Fresh Cottage Cheese (Paneer)', category: 'Dairy & Fresh', unit: 'kg', stockQty: 95, marketPrice: 380, freshnessStatus: 'Fresh', supplierId: 's2' },
  { id: 'veg_5', name: 'Fresh Mint & Coriander Leaves', category: 'Herbs & Greens', unit: 'bunch', stockQty: 120, marketPrice: 15, freshnessStatus: 'Fresh', supplierId: 's3' },
  { id: 'veg_6', name: 'Seasonal Assorted Cut Fruits', category: 'Fruit', unit: 'kg', stockQty: 75, marketPrice: 120, freshnessStatus: '1-2 Days Left', supplierId: 's3' }
];

export const initialLabourWorkers = [
  { id: 'lw_1', name: 'Master Chef Rameshwar Sharma', role: 'Head Chef', category: 'Head Cook', phone: '+91 98765 12001', dailyRate: 3500, agencyId: 'Direct Hire', type: 'Direct', status: 'Active', advancePayment: 5000, advances: [{ id: 'adv-001', amount: 5000, date: '2026-08-01', notes: 'Festival advance' }] },
  { id: 'lw_2', name: 'Sanjay Verma', role: 'Assistant Chef', category: 'Assistant Cook', phone: '+91 98765 12002', dailyRate: 2200, agencyId: 'Direct Hire', type: 'Direct', status: 'Active', advancePayment: 2000, advances: [{ id: 'adv-002', amount: 2000, date: '2026-08-05', notes: 'Emergency medical advance' }] },
  { id: 'lw_3', name: 'Rajesh Kumar', role: 'Captain/Supervisor', category: 'Management', phone: '+91 98111 22233', dailyRate: 1400, agencyId: 'a1', type: 'Agency', status: 'Active', advancePayment: 0, advances: [] },
  { id: 'lw_4', name: 'Vikram Singh', role: 'Waiter / Service Staff', category: 'Cutting and Supply', phone: '+91 98111 22234', dailyRate: 900, agencyId: 'a1', type: 'Agency', status: 'Active', advancePayment: 0, advances: [] },
  { id: 'lw_5', name: 'Amit Patel', role: 'Kitchen Helper', category: 'Loaders', phone: '+91 98980 44456', dailyRate: 750, agencyId: 'a2', type: 'Agency', status: 'Active', advancePayment: 1000, advances: [{ id: 'adv-003', amount: 1000, date: '2026-08-10', notes: 'Travel advance' }] },
  { id: 'lw_6', name: 'Dinesh Solanki', role: 'Utility Cleaner', category: 'Cleaners', phone: '+91 98980 44457', dailyRate: 650, agencyId: 'a2', type: 'Agency', status: 'Active', advancePayment: 0, advances: [] },
  { id: 'lw_7', name: 'Govindasamy', role: 'Sweet Specialist', category: 'Sweet Master', phone: '+91 98450 99881', dailyRate: 3000, agencyId: 'Direct Hire', type: 'Direct', status: 'Active', advancePayment: 3000, advances: [{ id: 'adv-004', amount: 3000, date: '2026-08-12', notes: 'Halwa season advance' }] },
  { id: 'lw_8', name: 'Manjula & Team', role: 'Service Associate', category: 'Ladies Supply', phone: '+91 98450 44332', dailyRate: 1100, agencyId: 'Direct Hire', type: 'Direct', status: 'Active', advancePayment: 0, advances: [] },
  { id: 'lw_9', name: 'Chettiar Master', role: 'Coffee Dispenser', category: 'Coffee Duty', phone: '+91 98450 22110', dailyRate: 1500, agencyId: 'Direct Hire', type: 'Direct', status: 'Active', advancePayment: 0, advances: [] }
];

export const initialMenuCategories = [
  { id: 'mc_1', name: 'Breakfast', description: 'Morning breakfast specials and tiffin', displayOrder: 1, active: true },
  { id: 'mc_2', name: 'Lunch', description: 'Grand afternoon traditional meals & banquets', displayOrder: 2, active: true },
  { id: 'mc_3', name: 'Dinner', description: 'Evening dinner feasts & high reception spreads', displayOrder: 3, active: true },
  { id: 'mc_4', name: 'Snacks', description: 'High-tea snacks, savories & chaats', displayOrder: 4, active: true }
];

export const initialVendorCategories = [
  { id: 'vc_1', name: 'Plant and Leaf', parentCategory: '', subCategories: ['Banana Leaf', 'Betel Leaf', 'Lotus Leaf'], active: true },
  { id: 'vc_2', name: 'Pan', parentCategory: '', subCategories: ['Sweet Paan', 'Fire Paan', 'Traditional Meetha Paan'], active: true },
  { id: 'vc_3', name: 'Water Bottle', parentCategory: '', subCategories: ['250ml Bottles', '500ml Bottles', '1 Litre Bottles'], active: true },
  { id: 'vc_4', name: 'Water Can', parentCategory: '', subCategories: ['20L Water Cans', 'Cooler Dispensers'], active: true },
  { id: 'vc_5', name: 'Coconut', parentCategory: '', subCategories: ['Tender Coconut', 'Regular Coconut'], active: true },
  { id: 'vc_6', name: 'Gold Thali', parentCategory: '', subCategories: ['Brass Thali', 'Silver-Plated Thali', 'Gold-Coated Service Plate'], active: true },
  { id: 'vc_7', name: 'Thambula', parentCategory: '', subCategories: ['Paper Thambula', 'Cloth Thambula', 'Jute Thambula'], active: true },
  { id: 'vc_8', name: 'Pots', parentCategory: '', subCategories: ['Clay Cooking Pots', 'Terracotta Serving Bowls', 'Matka Water Pots'], active: true },
  { id: 'vc_9', name: 'Uniform', parentCategory: '', subCategories: ['Chef Coats & Aprons', 'Captain Blazers', 'Service Staff Traditional Uniform'], active: true },
  { id: 'vc_10', name: 'Tea and Coffee Counter', parentCategory: '', subCategories: ['Brass Filter Coffee Station', 'Masala Chai Urn', 'Espresso Machine Setup'], active: true },
  { id: 'vc_11', name: 'Vessels', parentCategory: '', subCategories: ['Heavy Degchi & Handi', 'Chafing Dishes', 'Serving Trays & Ladles'], active: true },
  { id: 'vc_12', name: 'Dairy', parentCategory: '', subCategories: ['Fresh Milk & Curd', 'Paneer & Butter', 'Fresh Cream & Khoya'], active: true },
  { id: 'vc_13', name: 'Ice Cream', parentCategory: '', subCategories: ['Artisanal Scoops', 'Kulfi Counter', 'Soft Serve Station'], active: true },
  { id: 'vc_14', name: 'Chats', parentCategory: '', subCategories: ['Pani Puri Stall', 'Dahi Puri & Papdi', 'Aloo Tikki Live Counter'], active: true },
  { id: 'vc_15', name: 'Fruits', parentCategory: '', subCategories: ['Local Seasonal Fruits', 'Exotic Carved Fruits', 'Cut Fruit Salads'], active: true },
  { id: 'vc_16', name: 'Idli', parentCategory: '', subCategories: ['Button Idli Stalls', 'Thatte Idli Station', 'Rava Idli Counter'], active: true },
  { id: 'vc_17', name: 'Dosa', parentCategory: '', subCategories: ['Live Dosa Station', 'Benne Masala Dosa', 'Rava & Millet Dosa'], active: true },
  { id: 'vc_18', name: 'Mocktails', parentCategory: '', subCategories: ['Live Mocktail Bar', 'Tropical Smoothies', 'Fresh Fruit Juices'], active: true },
  { id: 'vc_19', name: 'Printers', parentCategory: '', subCategories: ['Menu Cards', 'Signboards & Labels', 'Event Token Passes'], active: true },
  { id: 'vc_20', name: 'Plastic Items', parentCategory: '', subCategories: ['Biodegradable Spoons', 'Buffet Rolls', 'Garbage Bags'], active: true },
  { id: 'vc_21', name: 'Cylinders', parentCategory: '', subCategories: ['19kg Commercial LPG', '47.5kg Industrial Cylinder'], active: true },
  { id: 'vc_22', name: 'Sweets', parentCategory: '', subCategories: ['Traditional South Indian Ghee Sweets', 'Bengali Milk Sweets', 'Dry Fruit Delicacies'], active: true },
  { id: 'vc_23', name: 'Peni', parentCategory: '', subCategories: ['Chiroti Peni', 'Badam Milk Peni', 'Saffron Peni'], active: true },
  { id: 'vc_24', name: 'Kunafa', parentCategory: '', subCategories: ['Classic Cheese Kunafa', 'Nutella Kunafa', 'Creamy Lotus Kunafa'], active: true },
  { id: 'vc_25', name: 'Charcoal', parentCategory: '', subCategories: ['Hardwood Tandoor Charcoal', 'Briquette Charcoal'], active: true },
  { id: 'vc_26', name: 'Ghee', parentCategory: '', subCategories: ['Pure Cow Desi Ghee', 'A2 Vedic Bilona Ghee', 'Buffalo Ghee'], active: true },
  { id: 'vc_27', name: 'Photographers', parentCategory: '', subCategories: ['Candid Event Photography', 'Traditional Photo Studio', 'Drone Videography'], active: true },
  { id: 'vc_28', name: 'Videographers', parentCategory: '', subCategories: ['Cinematic Film Team', 'Live Streaming Setup', 'LED Wall Feed'], active: true },
  { id: 'vc_29', name: 'Cake', parentCategory: '', subCategories: ['Multi-tier Wedding Cake', 'Designer Theme Cakes', 'Cupcakes & Pastries'], active: true },
  { id: 'vc_30', name: 'Grocery', parentCategory: '', subCategories: ['Rice & Grains', 'Pulses & Lentils', 'Oils & Condiments'], active: true },
  { id: 'vc_31', name: 'Spices', parentCategory: '', subCategories: ['Whole Spices', 'Ground Blends', 'Saffron & Cardamom'], active: true },
  { id: 'vc_32', name: 'Vegetables', parentCategory: '', subCategories: ['Country Vegetables', 'English Exotic Vegetables', 'Greens & Herbs'], active: true },
  { id: 'vc_33', name: 'Transport & Logistics', parentCategory: '', subCategories: ['Tempo / Chhota Hathi', '14ft Logistics Truck', 'Refrigerated Van'], active: true },
  { id: 'vc_34', name: 'Cleaning & Housekeeping', parentCategory: '', subCategories: ['Dishwashing Chemicals', 'Floor Sanitisers', 'Handwash Consumables'], active: true }
];

export const initialLabourCategories = [
  { id: 'lc_1', name: 'Head Cook', active: true },
  { id: 'lc_2', name: 'Assistant Cook', active: true },
  { id: 'lc_3', name: 'Sweet Master', active: true },
  { id: 'lc_4', name: 'Sweet Assistant', active: true },
  { id: 'lc_5', name: 'Management', active: true },
  { id: 'lc_6', name: 'Grinders', active: true },
  { id: 'lc_7', name: 'Cutting and Supply', active: true },
  { id: 'lc_8', name: 'Loaders', active: true },
  { id: 'lc_9', name: 'Cleaners', active: true },
  { id: 'lc_10', name: 'Ladies Supply', active: true },
  { id: 'lc_11', name: 'Coffee Duty', active: true }
];

export const initialLabourAttendance = [
  { id: 'att_1', workerId: 'lw_1', workerName: 'Master Chef Rameshwar Sharma', date: '2026-08-15', eventId: 'EV-2026-002', eventName: 'Tamil Nadu Gala', shiftType: 'Full Day', shifts: 1, dailyRate: 3500, totalWage: 3500, status: 'Present', notes: 'Lead preparation & sauce mastering' },
  { id: 'att_2', workerId: 'lw_2', workerName: 'Sanjay Verma', date: '2026-08-15', eventId: 'EV-2026-002', eventName: 'Tamil Nadu Gala', shiftType: 'Full Day', shifts: 1, dailyRate: 2200, totalWage: 2200, status: 'Present', notes: 'Dosa & Tiffin Counter' },
  { id: 'att_3', workerId: 'lw_3', workerName: 'Rajesh Kumar', date: '2026-08-15', eventId: 'EV-2026-002', eventName: 'Tamil Nadu Gala', shiftType: 'Double Shift', shifts: 2, dailyRate: 1400, totalWage: 2800, status: 'Overtime', notes: 'Banquet Floor Supervisor' },
  { id: 'att_4', workerId: 'lw_4', workerName: 'Vikram Singh', date: '2026-08-15', eventId: 'EV-2026-002', eventName: 'Tamil Nadu Gala', shiftType: 'Full Day', shifts: 1, dailyRate: 900, totalWage: 900, status: 'Present', notes: 'VIP Table Service' },
  { id: 'att_5', workerId: 'lw_5', workerName: 'Amit Patel', date: '2026-08-15', eventId: 'EV-2026-002', eventName: 'Tamil Nadu Gala', shiftType: 'Full Day', shifts: 1, dailyRate: 750, totalWage: 750, status: 'Present', notes: 'Vessel loading & pantry assistant' },
  { id: 'att_6', workerId: 'lw_1', workerName: 'Master Chef Rameshwar Sharma', date: '2026-08-18', eventId: 'EV-2026-003', eventName: 'Royal Rajasthani Banquet', shiftType: 'Full Day', shifts: 1, dailyRate: 3500, totalWage: 3500, status: 'Present', notes: 'Menu tasting & Dal Baati trial' },
  { id: 'att_7', workerId: 'lw_3', workerName: 'Rajesh Kumar', date: '2026-08-18', eventId: 'EV-2026-003', eventName: 'Royal Rajasthani Banquet', shiftType: 'Full Day', shifts: 1, dailyRate: 1400, totalWage: 1400, status: 'Present', notes: 'Staff briefing' }
];

export const initialEvents = [
  {
    id: 'EV-2026-001',
    customer: { name: 'Venkatesh Reddy', phone: '+91 98765 11111', email: 'venkatesh.reddy@gmail.com' },
    eventType: 'Authentic Andhra Wedding Feast',
    venueId: 'v3',
    date: '2026-06-15',
    dates: ['2026-06-15', '2026-06-16'],
    status: 'Completed',
    reminders: [],
    subFunctions: [
      { id: 'sf-1', name: 'Traditional Andhra Lunch', date: '2026-06-15', guestCount: 500, menuItems: ['si_rc_1', 'si_rc_2', 'si_rc_potali', 'si_grv_1', 'si_grv_9', 'si_grv_8', 'si_grv_16', 'si_grv_24', 'sd_ply_1', 'sd_sld_1', 'sw_hol_1', 'sw_hol_8', 'sw_hol_appi', 'bev_hot_1', 'fin_tam_2'], clientNotes: 'Authentic Guntur style spicy rasam and freshly made podi on plantain leaves.' }
    ],
    transport: {
      vehicles: [
        { id: 'vh-1', vehicleType: 'Mini-Truck (14ft)', vehicleNumber: 'KA-04-AB-1234', trips: 2, ratePerTrip: 3500, totalCost: 7000, driverName: 'Mani Swamy', driverPhone: '+91 98450 11223' },
        { id: 'vh-2', vehicleType: 'Tempo Traveller / Eeco', vehicleNumber: 'KA-04-CD-5678', trips: 1, ratePerTrip: 2000, totalCost: 2000, driverName: 'Suresh Gowda', driverPhone: '+91 98450 44556' }
      ],
      porters: [
        { id: 'pt-1', description: 'Heavy Utensils Loading & Unloading', count: 4, ratePerPorter: 750, totalCost: 3000 }
      ],
      totalTransportCost: 12000
    },
    execution: {
      teamRoutes: { 'si_rc_1': 'internal', 'si_rc_2': 'internal', 'si_rc_potali': 'outsourced', 'si_grv_1': 'internal', 'si_grv_9': 'internal', 'sw_hol_1': 'agency' },
      dishStatuses: { 'si_rc_1': 'Served', 'si_rc_2': 'Served', 'si_rc_potali': 'Served', 'si_grv_1': 'Served', 'si_grv_9': 'Served', 'sw_hol_1': 'Served' },
      costs: { rawMaterialsCost: 185000, laborCost: 45000, transportCost: 12000, venueRent: 200000, otherExpenses: 25000 }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 4, shifts: 2, totalPayout: 11200, status: 'Paid' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 35, shifts: 2, totalPayout: 63000, status: 'Paid' }
    ],
    billing: {
      pricePerPlate: 950, subtotal: 475000, taxRate: 18, taxAmount: 85500, totalAmount: 560500,
      advancePaid: 300000, balanceDue: 0, status: 'Fully Paid'
    }
  },
  {
    id: 'EV-2026-002',
    customer: { name: 'Priya Sundaram', phone: '+91 99240 88888', email: 'priya.sundaram@yahoo.com' },
    eventType: 'Tamil Nadu Style Gala Breakfast & Evening High Tea',
    venueId: 'v1',
    date: '2026-07-28',
    dates: ['2026-07-28'],
    status: 'Confirmed',
    reminders: [
      { id: 'rem-1', date: '2026-07-25', time: '11:00', note: 'Confirm morning filter coffee live dispenser installation with team', priority: 'High', completed: true, createdAt: '2026-07-20T10:00:00Z' }
    ],
    subFunctions: [
      { id: 'sf-2', name: 'Tamil Nadu Traditional Breakfast', date: '2026-07-28', guestCount: 300, menuItems: ['si_dsa_1', 'si_idl_5', 'si_dsa_4', 'si_grv_1', 'sd_acc_1', 'bev_hot_1'], clientNotes: 'Hot filter coffee in brass davarah-tumbler for all senior family guests.' },
      { id: 'sf-3', name: 'Evening High Tea & Refreshments', date: '2026-07-28', guestCount: 250, menuItems: ['app_snk_8', 'app_cht_1', 'bev_ffj_1', 'bev_mkl_1', 'sw_hol_4', 'fin_pan_1'], clientNotes: 'Serve mocktails chilled on entrance arrival.' }
    ],
    transport: {
      vehicles: [
        { id: 'vh-3', vehicleType: 'Tata Ace (Chhota Hathi)', vehicleNumber: 'KA-02-EE-9012', trips: 2, ratePerTrip: 2500, totalCost: 5000, driverName: 'Raghu K', driverPhone: '+91 98801 23456' }
      ],
      porters: [
        { id: 'pt-2', description: 'Morning setup porter team', count: 3, ratePerPorter: 650, totalCost: 1950 }
      ],
      totalTransportCost: 6950
    },
    execution: {
      teamRoutes: { 'si_dsa_1': 'internal', 'si_idl_5': 'internal', 'app_snk_8': 'internal', 'app_cht_1': 'outsourced', 'bev_mkl_1': 'agency' },
      dishStatuses: { 'si_dsa_1': 'Preparing', 'si_idl_5': 'Preparing', 'app_snk_8': 'Pending', 'app_cht_1': 'Pending', 'bev_mkl_1': 'Pending' },
      costs: { rawMaterialsCost: 120000, laborCost: 28000, transportCost: 6950, venueRent: 150000, otherExpenses: 15000 }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 2, shifts: 1, totalPayout: 2800, status: 'Verified' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 20, shifts: 1, totalPayout: 18000, status: 'Verified' }
    ],
    billing: {
      pricePerPlate: 1100, subtotal: 605000, taxRate: 18, taxAmount: 108900, totalAmount: 713900,
      advancePaid: 350000, balanceDue: 363900, status: 'Partially Paid'
    }
  },
  {
    id: 'EV-2026-003',
    customer: { name: 'Vikramaditya Rathore', phone: '+91 97129 33333', email: 'v.rathore@rajasthantech.com' },
    eventType: 'Royal Rajasthani Imperial Dinner',
    venueId: 'v2',
    date: '2026-08-20',
    dates: ['2026-08-20', '2026-08-21'],
    status: 'Inquiry',
    reminders: [
      { id: 'rem-2', date: '2026-08-19', time: '15:30', note: 'Call client Vikramaditya for final menu approval & token advance confirmation', priority: 'High', completed: false, createdAt: '2026-08-17T12:00:00Z' },
      { id: 'rem-3', date: '2026-08-20', time: '09:00', note: 'Send revised tax quotation with 15% discount for 2-day booking', priority: 'Medium', completed: false, createdAt: '2026-08-18T14:30:00Z' }
    ],
    subFunctions: [
      { id: 'sf-4', name: 'Royal Rajasthani Banquet', date: '2026-08-20', guestCount: 400, menuItems: ['ni_brd_chur', 'ni_brd_1', 'ni_grv_2', 'ni_grv_6', 'ni_rc_makh', 'app_str_sp1', 'sw_nor_1', 'sw_nor_chan', 'sw_ice_triv', 'fin_pan_4'], clientNotes: 'Pure desi cow ghee only for Dal Baati Churma. 50 Pax separate Jain counter without onion/garlic.' }
    ],
    transport: {
      vehicles: [
        { id: 'vh-4', vehicleType: 'Refrigerated Fresh Transport Van', vehicleNumber: 'KA-01-RF-7788', trips: 1, ratePerTrip: 4500, totalCost: 4500, driverName: 'Anand Kumar', driverPhone: '+91 99112 33445' },
        { id: 'vh-5', vehicleType: 'Mini-Truck (14ft)', vehicleNumber: 'KA-01-MT-9900', trips: 2, ratePerTrip: 3200, totalCost: 6400, driverName: 'Shivanna', driverPhone: '+91 99112 77889' }
      ],
      porters: [
        { id: 'pt-3', description: 'Kitchen degchi and brassware loading porters', count: 4, ratePerPorter: 700, totalCost: 2800 }
      ],
      totalTransportCost: 13700
    },
    execution: {
      teamRoutes: { 'ni_brd_chur': 'internal', 'ni_grv_2': 'internal', 'app_str_sp1': 'internal', 'sw_nor_1': 'outsourced' },
      dishStatuses: { 'ni_brd_chur': 'Pending', 'ni_grv_2': 'Pending', 'app_str_sp1': 'Pending', 'sw_nor_1': 'Pending' },
      costs: { rawMaterialsCost: 195000, laborCost: 48000, transportCost: 13700, venueRent: 120000, otherExpenses: 20000 }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 3, shifts: 1, totalPayout: 4200, status: 'Pending' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 30, shifts: 1, totalPayout: 27000, status: 'Pending' }
    ],
    billing: {
      pricePerPlate: 1400, subtotal: 560000, taxRate: 18, taxAmount: 100800, totalAmount: 660800,
      advancePaid: 0, balanceDue: 660800, status: 'Unpaid'
    }
  },
  {
    id: 'EV-2026-09-12',
    customer: { name: 'Kavitha & Arvind Rao', phone: '+91 99887 66554', email: 'arvind.rao@techindia.io' },
    eventType: 'Grand Multi-Cuisine Extravaganza Dinner',
    venueId: 'v3',
    date: '2026-09-12',
    dates: ['2026-09-12', '2026-09-13'],
    status: 'Confirmed',
    reminders: [
      { id: 'rem-4', date: '2026-09-08', time: '17:00', note: 'Pre-event banquet layout briefing with Arvind Rao', priority: 'Low', completed: false, createdAt: '2026-08-15T09:00:00Z' }
    ],
    subFunctions: [
      { id: 'sf-5', name: 'Global Multi-Cuisine Gala Dinner', date: '2026-09-12', guestCount: 650, menuItems: ['glb_ita_1', 'glb_chn_1', 'app_cht_13', 'app_str_op1', 'bev_mkl_3', 'ni_grv_6', 'si_rc_flw', 'sw_hol_cova', 'sw_ice_fig', 'fin_pan_1'], clientNotes: 'Live Artisan Pasta counter and Turkish Kunafa dessert live station requested.' }
    ],
    transport: {
      vehicles: [
        { id: 'vh-6', vehicleType: 'Heavy Logistics Truck', vehicleNumber: 'KA-05-TR-4321', trips: 2, ratePerTrip: 5000, totalCost: 10000, driverName: 'Naveen Kumar', driverPhone: '+91 98440 66778' },
        { id: 'vh-7', vehicleType: 'Tata Ace (Chhota Hathi)', vehicleNumber: 'KA-05-CH-8765', trips: 2, ratePerTrip: 2500, totalCost: 5000, driverName: 'Prakash', driverPhone: '+91 98440 88990' }
      ],
      porters: [
        { id: 'pt-4', description: 'Complete event setup & breakdown porters', count: 6, ratePerPorter: 800, totalCost: 4800 }
      ],
      totalTransportCost: 19800
    },
    execution: {
      teamRoutes: { 'glb_ita_1': 'agency', 'glb_chn_1': 'outsourced', 'app_cht_13': 'internal', 'ni_grv_6': 'internal', 'sw_ice_fig': 'internal' },
      dishStatuses: { 'glb_ita_1': 'Pending', 'glb_chn_1': 'Pending', 'app_cht_13': 'Pending', 'ni_grv_6': 'Pending', 'sw_ice_fig': 'Pending' },
      costs: { rawMaterialsCost: 340000, laborCost: 85000, transportCost: 19800, venueRent: 200000, otherExpenses: 40000 }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 5, shifts: 2, totalPayout: 14000, status: 'Pending' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 45, shifts: 2, totalPayout: 81000, status: 'Pending' },
      { agencyId: 'a2', laborType: 'Bartender / Mixologist', count: 6, shifts: 1, totalPayout: 9600, status: 'Pending' }
    ],
    billing: {
      pricePerPlate: 1850, subtotal: 1202500, taxRate: 18, taxAmount: 216450, totalAmount: 1418950,
      advancePaid: 600000, balanceDue: 818950, status: 'Partially Paid'
    }
  }
];
