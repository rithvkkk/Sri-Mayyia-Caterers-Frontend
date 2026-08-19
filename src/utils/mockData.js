export const initialVenues = [
  { id: 'v1', name: 'Royal Grand Ballroom', capacity: 500, price: 150000, address: 'S.G. Highway, Ahmedabad' },
  { id: 'v2', name: 'Lakeside Pavilion', capacity: 300, price: 120000, address: 'Kankaria Lake, Ahmedabad' },
  { id: 'v3', name: 'Garden Terrace & Lawn', capacity: 800, price: 200000, address: 'Bodakdev, Ahmedabad' },
  { id: 'v4', name: 'Elite Banquet Hall', capacity: 150, price: 75000, address: 'C.G. Road, Ahmedabad' }
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

import masterMenuData from '../data/catering_master_menu.json';

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

export const initialDishes = masterMenuData.categories.flatMap(cat =>
  cat.subCategories.flatMap(sub =>
    sub.items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      price: item.price,
      dietary: item.dietary || ['Vegetarian'],
      recipe: []
    }))
  )
);

export const initialSuppliers = [
  { id: 's1', name: 'Krishna Grocery Wholesalers', category: 'Grocery', contact: 'Ramesh Patel', phone: '+91 98765 43210' },
  { id: 's2', name: 'Amul Dairy Distributors', category: 'Dairy', contact: 'Suresh Shah', phone: '+91 98250 12345' },
  { id: 's3', name: 'Green Market Fresh Produce', category: 'Veg/Fruit', contact: 'Vijay Khetan', phone: '+91 99099 87654' },
  { id: 's4', name: 'HP Commercial Gas Corp', category: 'Fuel', contact: 'Dinesh Mehta', phone: '+91 97243 55566' }
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
  { id: 'ves_1', name: 'Aluminium Degchi (100 Litre)', category: 'Cooking Vessel', totalQty: 15, availableQty: 12, inUseQty: 3, damagedQty: 0, location: 'Kitchen Store A', valuePerUnit: 8500 },
  { id: 'ves_2', name: 'Brass Biryani Handi (50L)', category: 'Cooking Vessel', totalQty: 10, availableQty: 8, inUseQty: 2, damagedQty: 0, location: 'Kitchen Store A', valuePerUnit: 12000 },
  { id: 'ves_3', name: 'Stainless Steel Kadai (Big)', category: 'Cooking Vessel', totalQty: 18, availableQty: 15, inUseQty: 3, damagedQty: 0, location: 'Kitchen Store B', valuePerUnit: 4500 },
  { id: 'ves_4', name: 'Chafing Dishes Roll-Top Set', category: 'Serving Gear', totalQty: 45, availableQty: 35, inUseQty: 10, damagedQty: 0, location: 'Banquet Store', valuePerUnit: 3200 },
  { id: 'ves_5', name: 'Thermal Hot Transport Boxes (80L)', category: 'Serving Gear', totalQty: 25, availableQty: 20, inUseQty: 5, damagedQty: 0, location: 'Logistics Bay', valuePerUnit: 6500 },
  { id: 'ves_6', name: 'Royal Melamine Dinner Plates (Set of 100)', category: 'Utensils', totalQty: 25, availableQty: 22, inUseQty: 3, damagedQty: 0, location: 'Crockery Rack', valuePerUnit: 4800 },
  { id: 'ves_7', name: 'Commercial 3-Burner Gas Stove', category: 'Heating & Fuel', totalQty: 8, availableQty: 6, inUseQty: 2, damagedQty: 0, location: 'Kitchen Store B', valuePerUnit: 14500 }
];

export const initialProvisions = [
  { id: 'prv_1', name: 'Royal Aged Basmati Rice', category: 'Grocery', unit: 'kg', stockQty: 650, reorderLevel: 150, costPerUnit: 110, supplierId: 's1' },
  { id: 'prv_2', name: 'Premium Whole Wheat Atta', category: 'Grocery', unit: 'kg', stockQty: 400, reorderLevel: 100, costPerUnit: 45, supplierId: 's1' },
  { id: 'prv_3', name: 'Pure Cow Desi Ghee', category: 'Ghee & Oils', unit: 'kg', stockQty: 120, reorderLevel: 30, costPerUnit: 650, supplierId: 's2' },
  { id: 'prv_4', name: 'Refined Groundnut Oil', category: 'Ghee & Oils', unit: 'ltr', stockQty: 350, reorderLevel: 75, costPerUnit: 145, supplierId: 's1' },
  { id: 'prv_5', name: 'Shahi Garam Masala Blend', category: 'Spices & Condiments', unit: 'kg', stockQty: 25, reorderLevel: 8, costPerUnit: 420, supplierId: 's1' },
  { id: 'prv_6', name: 'Almonds & Cashew Nuts Mix', category: 'Dry Fruits', unit: 'kg', stockQty: 50, reorderLevel: 15, costPerUnit: 850, supplierId: 's1' }
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
  { id: 'lw_1', name: 'Master Chef Rameshwar Sharma', role: 'Head Chef', phone: '+91 98765 12001', dailyRate: 3500, agencyId: 'Direct Hire', type: 'Direct', status: 'Active' },
  { id: 'lw_2', name: 'Sanjay Verma', role: 'Assistant Chef', phone: '+91 98765 12002', dailyRate: 2200, agencyId: 'Direct Hire', type: 'Direct', status: 'Active' },
  { id: 'lw_3', name: 'Rajesh Kumar', role: 'Captain/Supervisor', phone: '+91 98111 22233', dailyRate: 1400, agencyId: 'a1', type: 'Agency', status: 'Active' },
  { id: 'lw_4', name: 'Vikram Singh', role: 'Waiter / Service Staff', phone: '+91 98111 22234', dailyRate: 900, agencyId: 'a1', type: 'Agency', status: 'Active' },
  { id: 'lw_5', name: 'Amit Patel', role: 'Kitchen Helper', phone: '+91 98980 44456', dailyRate: 750, agencyId: 'a2', type: 'Agency', status: 'Active' },
  { id: 'lw_6', name: 'Dinesh Solanki', role: 'Utility Cleaner', phone: '+91 98980 44457', dailyRate: 650, agencyId: 'a2', type: 'Agency', status: 'Active' }
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
      { id: 'sf-1', name: 'Traditional Andhra Lunch', date: '2026-06-15', guestCount: 500, menuItems: ['d_a1', 'd_a2', 'd_a6', 'd_a8', 'd_a9', 'd_a10', 'd_a12', 'd_a15', 'd_a18', 'd_a20', 'd_a22', 'd_a24', 'd_a31', 'd_a36', 'd_a37'], clientNotes: 'Authentic Guntur style spicy rasam and freshly made podi on plantain leaves.' }
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
      teamRoutes: { 'd_a1': 'internal', 'd_a2': 'outsourced', 'd_a9': 'internal', 'd_a10': 'internal', 'd_a15': 'agency' },
      dishStatuses: { 'd_a1': 'Served', 'd_a2': 'Served', 'd_a9': 'Served', 'd_a10': 'Served', 'd_a15': 'Served' },
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
      { id: 'sf-2', name: 'Tamil Nadu Traditional Breakfast', date: '2026-07-28', guestCount: 300, menuItems: ['d_tn1', 'd_tn2', 'd_tn3', 'd_tn7', 'd_tn8', 'd_tn9', 'd_tn12'], clientNotes: 'Hot filter coffee in brass davarah-tumbler for all senior family guests.' },
      { id: 'sf-3', name: 'Evening High Tea & Refreshments', date: '2026-07-28', guestCount: 250, menuItems: ['d_s1', 'd_s2', 'd_s5', 'd_s8', 'd_s9', 'd_s12', 'd_s14'], clientNotes: 'Serve mocktails chilled on entrance arrival.' }
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
      teamRoutes: { 'd_tn1': 'internal', 'd_tn2': 'internal', 'd_tn7': 'internal', 'd_s5': 'outsourced', 'd_s8': 'agency' },
      dishStatuses: { 'd_tn1': 'Preparing', 'd_tn2': 'Preparing', 'd_tn7': 'Preparing', 'd_s5': 'Pending', 'd_s8': 'Pending' },
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
      { id: 'sf-4', name: 'Royal Rajasthani Banquet', date: '2026-08-20', guestCount: 400, menuItems: ['d_r1', 'd_r2', 'd_r3', 'd_r9', 'd_r10', 'd_r13', 'd_r16', 'd_r19', 'd_r26', 'd_r28'], clientNotes: 'Pure desi cow ghee only for Dal Baati Churma. 50 Pax separate Jain counter without onion/garlic.' }
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
      teamRoutes: { 'd_r1': 'internal', 'd_r9': 'internal', 'd_r19': 'internal', 'd_r28': 'outsourced' },
      dishStatuses: { 'd_r1': 'Pending', 'd_r9': 'Pending', 'd_r19': 'Pending', 'd_r28': 'Pending' },
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
      { id: 'sf-5', name: 'Global Multi-Cuisine Gala Dinner', date: '2026-09-12', guestCount: 650, menuItems: ['d_d1', 'd_d4', 'd_d12', 'd_d15', 'd_d23', 'd_d26', 'd_d45', 'd_d47', 'd_d56', 'd_d64', 'd_d65', 'd_d81', 'd_d86', 'd_d102', 'd_d105', 'd_d110', 'd_d113'], clientNotes: 'Live Artisan Pasta counter and Turkish Kunafa dessert live station requested.' }
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
      teamRoutes: { 'd_d15': 'agency', 'd_d26': 'outsourced', 'd_d45': 'internal', 'd_d65': 'internal', 'd_d81': 'internal' },
      dishStatuses: { 'd_d15': 'Pending', 'd_d26': 'Pending', 'd_d45': 'Pending', 'd_d65': 'Pending', 'd_d81': 'Pending' },
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
