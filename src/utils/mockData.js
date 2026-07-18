export const initialVenues = [
  { id: 'v1', name: 'Royal Grand Ballroom', capacity: 500, price: 150000, address: 'S.G. Highway, Ahmedabad' },
  { id: 'v2', name: 'Lakeside Pavilion', capacity: 300, price: 120000, address: 'Kankaria Lake, Ahmedabad' },
  { id: 'v3', name: 'Garden Terrace & Lawn', capacity: 800, price: 200000, address: 'Bodakdev, Ahmedabad' },
  { id: 'v4', name: 'Elite Banquet Hall', capacity: 150, price: 75000, address: 'C.G. Road, Ahmedabad' }
];

export const initialRawMaterials = [
  // Grocery
  { id: 'rm1', name: 'Basmati Rice', category: 'Grocery', unit: 'kg', costPerUnit: 90 },
  { id: 'rm2', name: 'Wheat Flour (Atta)', category: 'Grocery', unit: 'kg', costPerUnit: 45 },
  { id: 'rm3', name: 'Sugar', category: 'Grocery', unit: 'kg', costPerUnit: 40 },
  { id: 'rm4', name: 'Spices Mix', category: 'Grocery', unit: 'kg', costPerUnit: 350 },
  { id: 'rm5', name: 'Cooking Oil', category: 'Grocery', unit: 'ltr', costPerUnit: 140 },
  { id: 'rm6', name: 'Lentils (Dal)', category: 'Grocery', unit: 'kg', costPerUnit: 120 },
  { id: 'rm7', name: 'Tea Leaves', category: 'Grocery', unit: 'kg', costPerUnit: 280 },
  { id: 'rm8', name: 'Chinese Sauces', category: 'Grocery', unit: 'ltr', costPerUnit: 95 },
  // Dairy
  { id: 'rm9', name: 'Fresh Paneer', category: 'Dairy', unit: 'kg', costPerUnit: 380 },
  { id: 'rm10', name: 'Amul Butter', category: 'Dairy', unit: 'kg', costPerUnit: 520 },
  { id: 'rm11', name: 'Fresh Cream', category: 'Dairy', unit: 'ltr', costPerUnit: 220 },
  { id: 'rm12', name: 'Full Cream Milk', category: 'Dairy', unit: 'ltr', costPerUnit: 66 },
  { id: 'rm13', name: 'Khoya (Mawa)', category: 'Dairy', unit: 'kg', costPerUnit: 320 },
  { id: 'rm14', name: 'Desi Ghee', category: 'Dairy', unit: 'kg', costPerUnit: 650 },
  // Veg/Fruit
  { id: 'rm15', name: 'Mixed Vegetables', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 50 },
  { id: 'rm16', name: 'Onions & Potatoes', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 35 },
  { id: 'rm17', name: 'Capsicum & Tomato', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 60 },
  { id: 'rm18', name: 'Mint & Lemon', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 80 },
  { id: 'rm19', name: 'Assorted Fresh Fruits', category: 'Veg/Fruit', unit: 'kg', costPerUnit: 120 },
  // Fuel
  { id: 'rm20', name: 'LPG Commercial Cylinder', category: 'Fuel', unit: 'cylinder', costPerUnit: 1850 },
  { id: 'rm21', name: 'Charcoal / Wood', category: 'Fuel', unit: 'bag', costPerUnit: 450 }
];

export const initialDishes = [
  // Starters
  {
    id: 'd1',
    name: 'Paneer Tikka Angara',
    category: 'Starters',
    price: 180,
    recipe: [
      { materialId: 'rm9', quantity: 0.12 },  // 120g Paneer
      { materialId: 'rm11', quantity: 0.02 }, // 20ml Cream
      { materialId: 'rm4', quantity: 0.01 },  // 10g Spices
      { materialId: 'rm5', quantity: 0.015 }, // 15ml Oil
      { materialId: 'rm21', quantity: 0.05 }  // 0.05 bag charcoal (cooking)
    ]
  },
  {
    id: 'd2',
    name: 'Veg Manchurian Dry',
    category: 'Starters',
    price: 150,
    recipe: [
      { materialId: 'rm15', quantity: 0.10 }, // 100g Mixed Veg
      { materialId: 'rm8', quantity: 0.02 },  // 20ml Sauces
      { materialId: 'rm2', quantity: 0.03 },  // 30g Flour
      { materialId: 'rm5', quantity: 0.02 },  // 20ml Oil
      { materialId: 'rm20', quantity: 0.005 } // 0.005 Gas Cylinder
    ]
  },
  {
    id: 'd3',
    name: 'Hara Bhara Kabab',
    category: 'Starters',
    price: 140,
    recipe: [
      { materialId: 'rm15', quantity: 0.08 }, // Veggies
      { materialId: 'rm16', quantity: 0.05 }, // Potatoes
      { materialId: 'rm5', quantity: 0.025 }, // Oil
      { materialId: 'rm4', quantity: 0.005 }  // Spices
    ]
  },
  // Mains
  {
    id: 'd4',
    name: 'Dal Makhani Special',
    category: 'Mains',
    price: 220,
    recipe: [
      { materialId: 'rm6', quantity: 0.08 },  // 80g Lentils
      { materialId: 'rm10', quantity: 0.025 }, // 25g Butter
      { materialId: 'rm11', quantity: 0.02 },  // 20ml Cream
      { materialId: 'rm4', quantity: 0.008 },  // Spices
      { materialId: 'rm20', quantity: 0.008 } // Gas
    ]
  },
  {
    id: 'd5',
    name: 'Shahi Kadhai Paneer',
    category: 'Mains',
    price: 250,
    recipe: [
      { materialId: 'rm9', quantity: 0.12 },  // Paneer
      { materialId: 'rm17', quantity: 0.06 }, // Capsicum/Tomato
      { materialId: 'rm11', quantity: 0.015 }, // Cream
      { materialId: 'rm4', quantity: 0.01 },   // Spices
      { materialId: 'rm5', quantity: 0.015 },  // Oil
      { materialId: 'rm20', quantity: 0.006 }  // Gas
    ]
  },
  {
    id: 'd6',
    name: 'Jeera Rice / Veg Pulao',
    category: 'Mains',
    price: 130,
    recipe: [
      { materialId: 'rm1', quantity: 0.10 },  // Rice
      { materialId: 'rm15', quantity: 0.04 }, // Veg
      { materialId: 'rm14', quantity: 0.01 },  // Ghee
      { materialId: 'rm20', quantity: 0.004 } // Gas
    ]
  },
  {
    id: 'd7',
    name: 'Butter Naan / Tandoori Roti',
    category: 'Mains',
    price: 40,
    recipe: [
      { materialId: 'rm2', quantity: 0.08 },  // Atta
      { materialId: 'rm10', quantity: 0.015 }, // Butter
      { materialId: 'rm21', quantity: 0.06 }  // Charcoal
    ]
  },
  // Desserts
  {
    id: 'd8',
    name: 'Gulab Jamun (Double)',
    category: 'Desserts',
    price: 80,
    recipe: [
      { materialId: 'rm13', quantity: 0.06 }, // Mawa
      { materialId: 'rm3', quantity: 0.10 },  // Sugar
      { materialId: 'rm14', quantity: 0.015 }, // Ghee
      { materialId: 'rm20', quantity: 0.008 } // Gas
    ]
  },
  {
    id: 'd9',
    name: 'Kesar Pista Ice Cream',
    category: 'Desserts',
    price: 90,
    recipe: [
      { materialId: 'rm12', quantity: 0.15 }, // Milk
      { materialId: 'rm3', quantity: 0.02 },  // Sugar
      { materialId: 'rm19', quantity: 0.01 }   // Nuts/Flavor
    ]
  },
  // Beverages
  {
    id: 'd10',
    name: 'Fresh Mint Mojito',
    category: 'Beverages',
    price: 100,
    recipe: [
      { materialId: 'rm18', quantity: 0.05 }, // Mint & Lemon
      { materialId: 'rm3', quantity: 0.025 }, // Sugar
      { materialId: 'rm5', quantity: 0 }      // Soda is external or bought
    ]
  },
  {
    id: 'd11',
    name: 'Masala Shahi Tea',
    category: 'Beverages',
    price: 40,
    recipe: [
      { materialId: 'rm12', quantity: 0.08 }, // Milk
      { materialId: 'rm7', quantity: 0.006 }, // Tea
      { materialId: 'rm3', quantity: 0.015 }, // Sugar
      { materialId: 'rm4', quantity: 0.002 }  // Tea Spices
    ]
  }
];

export const initialSuppliers = [
  { id: 's1', name: 'Krishna Grocery Wholesalers', category: 'Grocery', contact: 'Ramesh Patel', phone: '+91 98765 43210' },
  { id: 's2', name: 'Amul Dairy Distributors', category: 'Dairy', contact: 'Suresh Shah', phone: '+91 98250 12345' },
  { id: 's3', name: 'Green Market Fresh Produce', category: 'Veg/Fruit', contact: 'Vijay Khetan', phone: '+91 99099 87654' },
  { id: 's4', name: 'HP Commercial Gas Corp', category: 'Fuel', contact: 'Dinesh Mehta', phone: '+91 97243 55566' }
];

export const initialLaborRates = [
  { id: 'l1', type: 'Captain/Supervisor', rate: 1200 },
  { id: 'l2', type: 'Waiter / Service Staff', rate: 800 },
  { id: 'l3', type: 'Bartender', rate: 1500 },
  { id: 'l4', type: 'Kitchen Helper', rate: 700 },
  { id: 'l5', type: 'Utility Cleaner', rate: 600 }
];

export const initialAgencies = [
  { id: 'a1', name: 'Royal Hospitality Services', contact: 'Harsh Vyas', phone: '+91 98111 22233', categories: ['Waiter / Service Staff', 'Captain/Supervisor'] },
  { id: 'a2', name: 'Apex Event Staffing Co', contact: 'Nikhil Parmar', phone: '+91 98980 44455', categories: ['Bartender', 'Kitchen Helper', 'Utility Cleaner'] }
];

export const initialEvents = [
  {
    id: 'EV-2026-001',
    customer: {
      name: 'Anil Sharma',
      phone: '+91 98765 11111',
      email: 'anil.sharma@gmail.com'
    },
    eventType: 'Wedding Reception',
    venueId: 'v3',
    date: '2026-06-15',
    status: 'Completed',
    subFunctions: [
      {
        id: 'sf-1',
        name: 'Wedding Lunch',
        guestCount: 400,
        menuItems: ['d1', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd11']
      },
      {
        id: 'sf-2',
        name: 'Grand Reception Dinner',
        guestCount: 600,
        menuItems: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd11']
      }
    ],
    execution: {
      teamRoutes: {
        'd1': 'internal',
        'd2': 'outsourced',
        'd3': 'internal',
        'd4': 'internal',
        'd5': 'agency',
        'd6': 'internal',
        'd7': 'agency',
        'd8': 'internal',
        'd9': 'outsourced',
        'd10': 'agency',
        'd11': 'internal'
      },
      costs: {
        rawMaterialsCost: 285000,
        laborCost: 65000,
        venueRent: 200000,
        otherExpenses: 45000
      }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 4, shifts: 2, totalPayout: 9600, status: 'Paid' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 30, shifts: 2, totalPayout: 48000, status: 'Paid' },
      { agencyId: 'a2', laborType: 'Bartender', count: 4, shifts: 1, totalPayout: 6000, status: 'Paid' }
    ],
    billing: {
      pricePerPlate: 950,
      subtotal: 950000,
      taxRate: 18, // GST
      taxAmount: 171000,
      totalAmount: 1121000,
      advancePaid: 500000,
      balanceDue: 0,
      status: 'Fully Paid'
    }
  },
  {
    id: 'EV-2026-002',
    customer: {
      name: 'Preeti Patel',
      phone: '+91 99240 88888',
      email: 'preeti.patel@yahoo.com'
    },
    eventType: '25th Anniversary Gala',
    venueId: 'v1',
    date: '2026-07-28',
    status: 'Confirmed',
    subFunctions: [
      {
        id: 'sf-3',
        name: 'Anniversary Dinner',
        guestCount: 250,
        menuItems: ['d1', 'd2', 'd5', 'd6', 'd7', 'd9', 'd10']
      }
    ],
    execution: {
      teamRoutes: {
        'd1': 'internal',
        'd2': 'internal',
        'd5': 'internal',
        'd6': 'internal',
        'd7': 'agency',
        'd9': 'outsourced',
        'd10': 'agency'
      },
      costs: {
        rawMaterialsCost: 85200,
        laborCost: 18600,
        venueRent: 150000,
        otherExpenses: 12000
      }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 2, shifts: 1, totalPayout: 2400, status: 'Verified' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 15, shifts: 1, totalPayout: 12000, status: 'Verified' },
      { agencyId: 'a2', laborType: 'Bartender', count: 2, shifts: 1, totalPayout: 3000, status: 'Verified' },
      { agencyId: 'a2', laborType: 'Utility Cleaner', count: 2, shifts: 1, totalPayout: 1200, status: 'Pending' }
    ],
    billing: {
      pricePerPlate: 1200,
      subtotal: 300000,
      taxRate: 18,
      taxAmount: 54000,
      totalAmount: 354000,
      advancePaid: 150000,
      balanceDue: 204000,
      status: 'Partially Paid'
    }
  },
  {
    id: 'EV-2026-003',
    customer: {
      name: 'Rohan Mehta (Adani Group)',
      phone: '+91 97129 33333',
      email: 'rohan.mehta@adani.com'
    },
    eventType: 'Corporate Annual Meet',
    venueId: 'v4',
    date: '2026-08-10',
    status: 'Inquiry',
    subFunctions: [
      {
        id: 'sf-4',
        name: 'Conference Lunch',
        guestCount: 120,
        menuItems: ['d3', 'd4', 'd6', 'd7', 'd8', 'd11']
      }
    ],
    execution: {
      teamRoutes: {
        'd3': 'internal',
        'd4': 'internal',
        'd6': 'internal',
        'd7': 'internal',
        'd8': 'internal',
        'd11': 'internal'
      },
      costs: {
        rawMaterialsCost: 28400,
        laborCost: 6800,
        venueRent: 75000,
        otherExpenses: 5000
      }
    },
    laborAllocations: [
      { agencyId: 'a1', laborType: 'Captain/Supervisor', count: 1, shifts: 1, totalPayout: 1200, status: 'Pending' },
      { agencyId: 'a1', laborType: 'Waiter / Service Staff', count: 7, shifts: 1, totalPayout: 5600, status: 'Pending' }
    ],
    billing: {
      pricePerPlate: 850,
      subtotal: 102000,
      taxRate: 18,
      taxAmount: 18360,
      totalAmount: 120360,
      advancePaid: 0,
      balanceDue: 120360,
      status: 'Unpaid'
    }
  }
];
