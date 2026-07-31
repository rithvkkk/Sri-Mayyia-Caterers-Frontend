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

export const initialDishes = [
  // 1. Authentic Andhra Lunch
  { id: 'd_a1', name: 'Poornam Borellu', category: 'Sweets & Desserts', price: 60, recipe: [{ materialId: 'rm3', quantity: 0.05 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_a2', name: 'Dry Fruit Jaggery Puthurekulu', category: 'Sweets & Desserts', price: 90, recipe: [{ materialId: 'rm3', quantity: 0.04 }, { materialId: 'rm14', quantity: 0.02 }] },
  { id: 'd_a3', name: 'Madtha Kaja', category: 'Sweets & Desserts', price: 50, recipe: [{ materialId: 'rm2', quantity: 0.06 }, { materialId: 'rm3', quantity: 0.05 }] },
  { id: 'd_a4', name: 'Kurban Ka Meeta', category: 'Sweets & Desserts', price: 70, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm3', quantity: 0.04 }] },
  { id: 'd_a5', name: 'Sabsige Beeyam Parvanam', category: 'Sweets & Desserts', price: 60, recipe: [{ materialId: 'rm1', quantity: 0.05 }, { materialId: 'rm12', quantity: 0.1 }] },
  { id: 'd_a6', name: 'Sabsige Masala Roti with Chutney', category: 'Breads & Live Stalls', price: 55, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm5', quantity: 0.01 }] },
  { id: 'd_a7', name: 'Rumali Roti', category: 'Breads & Live Stalls', price: 35, recipe: [{ materialId: 'rm2', quantity: 0.07 }] },
  { id: 'd_a8', name: 'MLA Pesarattu', category: 'Breads & Live Stalls', price: 75, recipe: [{ materialId: 'rm6', quantity: 0.08 }, { materialId: 'rm5', quantity: 0.015 }] },
  { id: 'd_a9', name: 'Channa Paneer Masala', category: 'Curries, Rice & Sides', price: 140, recipe: [{ materialId: 'rm9', quantity: 0.08 }, { materialId: 'rm6', quantity: 0.05 }] },
  { id: 'd_a10', name: 'Raw Jackfruit Biriyani', category: 'Curries, Rice & Sides', price: 180, recipe: [{ materialId: 'rm1', quantity: 0.12 }, { materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_a11', name: 'Raitha', category: 'Curries, Rice & Sides', price: 30, recipe: [{ materialId: 'rm12', quantity: 0.05 }] },
  { id: 'd_a12', name: 'Coconut Milk Rice', category: 'Curries, Rice & Sides', price: 120, recipe: [{ materialId: 'rm1', quantity: 0.1 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_a13', name: 'Puliyora - Side', category: 'Curries, Rice & Sides', price: 70, recipe: [{ materialId: 'rm1', quantity: 0.08 }, { materialId: 'rm4', quantity: 0.01 }] },
  { id: 'd_a14', name: 'Kanda Bacchali', category: 'Curries, Rice & Sides', price: 95, recipe: [{ materialId: 'rm15', quantity: 0.1 }] },
  { id: 'd_a15', name: 'Guttuvankai Fry', category: 'Curries, Rice & Sides', price: 110, recipe: [{ materialId: 'rm15', quantity: 0.12 }, { materialId: 'rm5', quantity: 0.02 }] },
  { id: 'd_a16', name: 'Bendikai Fry', category: 'Curries, Rice & Sides', price: 85, recipe: [{ materialId: 'rm15', quantity: 0.1 }] },
  { id: 'd_a17', name: 'Veg Kosambari', category: 'Curries, Rice & Sides', price: 40, recipe: [{ materialId: 'rm6', quantity: 0.03 }] },
  { id: 'd_a18', name: 'White Rice', category: 'Curries, Rice & Sides', price: 40, recipe: [{ materialId: 'rm1', quantity: 0.12 }] },
  { id: 'd_a19', name: 'Mukkulu Pulusu', category: 'Curries, Rice & Sides', price: 80, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_a20', name: 'Mammidikaya Pappu + Ghee', category: 'Curries, Rice & Sides', price: 90, recipe: [{ materialId: 'rm6', quantity: 0.06 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_a21', name: 'Vuluvulu Charu + Cream', category: 'Curries, Rice & Sides', price: 75, recipe: [{ materialId: 'rm6', quantity: 0.05 }, { materialId: 'rm11', quantity: 0.01 }] },
  { id: 'd_a22', name: 'Tomato Miriyala Rasam', category: 'Curries, Rice & Sides', price: 45, recipe: [{ materialId: 'rm17', quantity: 0.05 }] },
  { id: 'd_a23', name: 'Karam Chutney', category: 'Chutneys, Podis & Starters', price: 20, recipe: [{ materialId: 'rm4', quantity: 0.005 }] },
  { id: 'd_a24', name: 'Karam Pudi', category: 'Chutneys, Podis & Starters', price: 20, recipe: [{ materialId: 'rm4', quantity: 0.005 }] },
  { id: 'd_a25', name: 'Allam Chutney', category: 'Chutneys, Podis & Starters', price: 25, recipe: [{ materialId: 'rm18', quantity: 0.01 }] },
  { id: 'd_a26', name: 'Berakaya Pachadi', category: 'Chutneys, Podis & Starters', price: 30, recipe: [{ materialId: 'rm15', quantity: 0.03 }] },
  { id: 'd_a27', name: 'Karivepakupudi', category: 'Chutneys, Podis & Starters', price: 20, recipe: [{ materialId: 'rm4', quantity: 0.005 }] },
  { id: 'd_a28', name: 'Kandipudi', category: 'Chutneys, Podis & Starters', price: 20, recipe: [{ materialId: 'rm6', quantity: 0.01 }] },
  { id: 'd_a29', name: 'Butter Chilly', category: 'Chutneys, Podis & Starters', price: 15, recipe: [{ materialId: 'rm10', quantity: 0.005 }] },
  { id: 'd_a30', name: 'Gummadi Vadeyalu', category: 'Chutneys, Podis & Starters', price: 25, recipe: [{ materialId: 'rm15', quantity: 0.02 }] },
  { id: 'd_a31', name: 'Alu Bonda', category: 'Chutneys, Podis & Starters', price: 40, recipe: [{ materialId: 'rm16', quantity: 0.06 }] },
  { id: 'd_a32', name: 'Nellore Vada', category: 'Chutneys, Podis & Starters', price: 50, recipe: [{ materialId: 'rm6', quantity: 0.05 }] },
  { id: 'd_a33', name: 'Gongura Pachadi', category: 'Chutneys, Podis & Starters', price: 35, recipe: [{ materialId: 'rm18', quantity: 0.02 }] },
  { id: 'd_a34', name: 'Dosa Avakaya', category: 'Chutneys, Podis & Starters', price: 30, recipe: [{ materialId: 'rm19', quantity: 0.02 }] },
  { id: 'd_a35', name: 'Refreshive Wet Napkin', category: 'Beverages & Extras', price: 10, recipe: [] },
  { id: 'd_a36', name: 'Special Meetha Pan', category: 'Beverages & Extras', price: 25, recipe: [] },
  { id: 'd_a37', name: 'Mineral Water Bottle', category: 'Beverages & Extras', price: 20, recipe: [] },

  // 2. Evening Snacks
  { id: 'd_s1', name: 'Mohabath Ka Sharabeth', category: 'Welcome Drinks & Refreshments', price: 60, recipe: [{ materialId: 'rm12', quantity: 0.15 }, { materialId: 'rm3', quantity: 0.02 }] },
  { id: 'd_s2', name: 'Filter Coffee', category: 'Welcome Drinks & Refreshments', price: 30, recipe: [{ materialId: 'rm7', quantity: 0.01 }, { materialId: 'rm12', quantity: 0.1 }] },
  { id: 'd_s3', name: 'Masala Tea', category: 'Welcome Drinks & Refreshments', price: 25, recipe: [{ materialId: 'rm7', quantity: 0.008 }, { materialId: 'rm12', quantity: 0.08 }] },
  { id: 'd_s4', name: 'Shavige Rawa Bath', category: 'Snacks & Starters', price: 50, recipe: [{ materialId: 'rm2', quantity: 0.06 }, { materialId: 'rm15', quantity: 0.03 }] },
  { id: 'd_s5', name: 'Dragon Roll', category: 'Snacks & Starters', price: 90, recipe: [{ materialId: 'rm15', quantity: 0.06 }, { materialId: 'rm8', quantity: 0.01 }] },
  { id: 'd_s6', name: 'Sante Bonda', category: 'Snacks & Starters', price: 45, recipe: [{ materialId: 'rm16', quantity: 0.05 }] },
  { id: 'd_s7', name: 'Beetroot Alu Cutlet', category: 'Snacks & Starters', price: 55, recipe: [{ materialId: 'rm16', quantity: 0.06 }] },
  { id: 'd_s8', name: 'Paneer Grill', category: 'Snacks & Starters', price: 110, recipe: [{ materialId: 'rm9', quantity: 0.1 }] },
  { id: 'd_s9', name: 'Bread Samosa', category: 'Snacks & Starters', price: 40, recipe: [{ materialId: 'rm16', quantity: 0.05 }, { materialId: 'rm2', quantity: 0.03 }] },
  { id: 'd_s10', name: 'Bonda Soup', category: 'Snacks & Starters', price: 65, recipe: [{ materialId: 'rm16', quantity: 0.05 }, { materialId: 'rm6', quantity: 0.03 }] },
  { id: 'd_s11', name: 'Long Chilli Bajji', category: 'Snacks & Starters', price: 40, recipe: [{ materialId: 'rm17', quantity: 0.04 }] },
  { id: 'd_s12', name: 'Crispy Onion Rings', category: 'Snacks & Starters', price: 50, recipe: [{ materialId: 'rm16', quantity: 0.06 }] },
  { id: 'd_s13', name: 'Capsicum Rings', category: 'Snacks & Starters', price: 55, recipe: [{ materialId: 'rm17', quantity: 0.06 }] },
  { id: 'd_s14', name: 'Sapota Halwa', category: 'Sweets & Condiments', price: 70, recipe: [{ materialId: 'rm19', quantity: 0.08 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_s15', name: 'Tomato Sauce', category: 'Sweets & Condiments', price: 10, recipe: [{ materialId: 'rm8', quantity: 0.01 }] },
  { id: 'd_s16', name: 'Mint Chutney', category: 'Sweets & Condiments', price: 15, recipe: [{ materialId: 'rm18', quantity: 0.01 }] },

  // 3. Rajasthani Dinner
  { id: 'd_r1', name: 'Tomato Coriander Seeds Shorba', category: 'Soups & Starters', price: 65, recipe: [{ materialId: 'rm17', quantity: 0.08 }] },
  { id: 'd_r2', name: 'Mughlai Zaffrani Soup', category: 'Soups & Starters', price: 85, recipe: [{ materialId: 'rm11', quantity: 0.02 }, { materialId: 'rm12', quantity: 0.1 }] },
  { id: 'd_r3', name: 'Khakhra Sandwich', category: 'Soups & Starters', price: 55, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm15', quantity: 0.03 }] },
  { id: 'd_r4', name: 'Rings Small Kodubele Masala', category: 'Soups & Starters', price: 45, recipe: [{ materialId: 'rm2', quantity: 0.04 }] },
  { id: 'd_r5', name: 'Khandvi', category: 'Soups & Starters', price: 60, recipe: [{ materialId: 'rm6', quantity: 0.04 }, { materialId: 'rm12', quantity: 0.05 }] },
  { id: 'd_r6', name: 'Mini Kachori', category: 'Soups & Starters', price: 40, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm6', quantity: 0.02 }] },
  { id: 'd_r7', name: 'Dhokla Sandwich', category: 'Soups & Starters', price: 50, recipe: [{ materialId: 'rm6', quantity: 0.05 }] },
  { id: 'd_r8', name: 'Palak Patta Chaat', category: 'Soups & Starters', price: 65, recipe: [{ materialId: 'rm15', quantity: 0.06 }, { materialId: 'rm5', quantity: 0.01 }] },
  { id: 'd_r9', name: 'Dal Baati Churma', category: 'Breads & Main Course', price: 160, recipe: [{ materialId: 'rm2', quantity: 0.1 }, { materialId: 'rm6', quantity: 0.06 }, { materialId: 'rm14', quantity: 0.03 }] },
  { id: 'd_r10', name: 'Alu Capsicum Sabji', category: 'Breads & Main Course', price: 110, recipe: [{ materialId: 'rm16', quantity: 0.06 }, { materialId: 'rm17', quantity: 0.04 }] },
  { id: 'd_r11', name: 'Okra Jaipuri Sabji', category: 'Breads & Main Course', price: 120, recipe: [{ materialId: 'rm15', quantity: 0.1 }] },
  { id: 'd_r12', name: 'Missi Roti', category: 'Breads & Main Course', price: 40, recipe: [{ materialId: 'rm2', quantity: 0.06 }, { materialId: 'rm6', quantity: 0.02 }] },
  { id: 'd_r13', name: 'Rajasthani Kadhi', category: 'Breads & Main Course', price: 90, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm6', quantity: 0.03 }] },
  { id: 'd_r14', name: 'Moong Dal Roti', category: 'Breads & Main Course', price: 35, recipe: [{ materialId: 'rm2', quantity: 0.05 }] },
  { id: 'd_r15', name: 'Rajma Masala', category: 'Breads & Main Course', price: 130, recipe: [{ materialId: 'rm6', quantity: 0.08 }] },
  { id: 'd_r16', name: 'Laccha Paratha', category: 'Breads & Main Course', price: 45, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_r17', name: 'Mix Veg Curry', category: 'Breads & Main Course', price: 120, recipe: [{ materialId: 'rm15', quantity: 0.1 }] },
  { id: 'd_r18', name: 'Bajri Ki Roti + Ghee', category: 'Breads & Main Course', price: 40, recipe: [{ materialId: 'rm2', quantity: 0.07 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_r19', name: 'Kacchi Haldi Ka Sabji', category: 'Breads & Main Course', price: 150, recipe: [{ materialId: 'rm15', quantity: 0.08 }, { materialId: 'rm14', quantity: 0.02 }] },
  { id: 'd_r20', name: 'Jeera Rice', category: 'Breads & Main Course', price: 80, recipe: [{ materialId: 'rm1', quantity: 0.1 }, { materialId: 'rm14', quantity: 0.005 }] },
  { id: 'd_r21', name: 'Dal Makhani', category: 'Breads & Main Course', price: 140, recipe: [{ materialId: 'rm6', quantity: 0.08 }, { materialId: 'rm10', quantity: 0.02 }] },
  { id: 'd_r22', name: 'Steamed Rice', category: 'Breads & Main Course', price: 40, recipe: [{ materialId: 'rm1', quantity: 0.1 }] },
  { id: 'd_r23', name: 'Majjige Huli', category: 'Breads & Main Course', price: 70, recipe: [{ materialId: 'rm12', quantity: 0.08 }] },
  { id: 'd_r24', name: 'Pepper Rasam', category: 'Breads & Main Course', price: 45, recipe: [{ materialId: 'rm17', quantity: 0.04 }] },
  { id: 'd_r25', name: 'Royal Rice Kheer', category: 'Sweets & Desserts', price: 70, recipe: [{ materialId: 'rm1', quantity: 0.03 }, { materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_r26', name: 'Moong Dal Halwa', category: 'Sweets & Desserts', price: 90, recipe: [{ materialId: 'rm6', quantity: 0.05 }, { materialId: 'rm14', quantity: 0.02 }, { materialId: 'rm3', quantity: 0.04 }] },
  { id: 'd_r27', name: 'Pista Kalakand', category: 'Sweets & Desserts', price: 85, recipe: [{ materialId: 'rm13', quantity: 0.05 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_r28', name: 'Malai Ghevar', category: 'Sweets & Desserts', price: 110, recipe: [{ materialId: 'rm2', quantity: 0.05 }, { materialId: 'rm11', quantity: 0.02 }] },
  { id: 'd_r29', name: 'Churma Laddoo', category: 'Sweets & Desserts', price: 65, recipe: [{ materialId: 'rm2', quantity: 0.05 }, { materialId: 'rm14', quantity: 0.015 }] },
  { id: 'd_r30', name: 'Artisanal Ice Cream', category: 'Sweets & Desserts', price: 60, recipe: [{ materialId: 'rm12', quantity: 0.1 }] },
  { id: 'd_r31', name: 'Shahi Falooda', category: 'Sweets & Desserts', price: 80, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm3', quantity: 0.02 }] },
  { id: 'd_r32', name: 'White Chocolate with Lychee Ice Cream', category: 'Sweets & Desserts', price: 120, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm19', quantity: 0.03 }] },
  { id: 'd_r33', name: 'Masala Chaas / Buttermilk', category: 'Salads, Sides & Drinks', price: 30, recipe: [{ materialId: 'rm12', quantity: 0.1 }] },

  // 4. Tamil Nadu Style Breakfast
  { id: 'd_tn1', name: 'Kushboo Idly', category: 'Main Items', price: 40, recipe: [{ materialId: 'rm1', quantity: 0.05 }, { materialId: 'rm6', quantity: 0.02 }] },
  { id: 'd_tn2', name: 'Medhu Vadai', category: 'Main Items', price: 45, recipe: [{ materialId: 'rm6', quantity: 0.05 }, { materialId: 'rm5', quantity: 0.015 }] },
  { id: 'd_tn3', name: 'Onion Uttappam', category: 'Main Items', price: 60, recipe: [{ materialId: 'rm1', quantity: 0.06 }, { materialId: 'rm16', quantity: 0.03 }] },
  { id: 'd_tn4', name: 'Appam | Adai Dosa', category: 'Main Items', price: 70, recipe: [{ materialId: 'rm1', quantity: 0.06 }, { materialId: 'rm6', quantity: 0.02 }] },
  { id: 'd_tn5', name: 'Kothu Patara', category: 'Main Items', price: 65, recipe: [{ materialId: 'rm2', quantity: 0.06 }, { materialId: 'rm15', quantity: 0.04 }] },
  { id: 'd_tn6', name: 'Idiyappam', category: 'Main Items', price: 55, recipe: [{ materialId: 'rm1', quantity: 0.06 }] },
  { id: 'd_tn7', name: 'Madras Ghee Ven Pongal', category: 'Main Items', price: 65, recipe: [{ materialId: 'rm1', quantity: 0.06 }, { materialId: 'rm6', quantity: 0.02 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_tn8', name: 'Tiffin Sambar', category: 'Sides & Gravies', price: 30, recipe: [{ materialId: 'rm6', quantity: 0.03 }, { materialId: 'rm15', quantity: 0.03 }] },
  { id: 'd_tn9', name: 'Coconut & Kara Chutney', category: 'Sides & Gravies', price: 20, recipe: [{ materialId: 'rm4', quantity: 0.005 }] },
  { id: 'd_tn10', name: 'Veg Gravy', category: 'Sides & Gravies', price: 50, recipe: [{ materialId: 'rm15', quantity: 0.06 }] },
  { id: 'd_tn11', name: 'Veg Kurma', category: 'Sides & Gravies', price: 55, recipe: [{ materialId: 'rm15', quantity: 0.06 }] },
  { id: 'd_tn12', name: 'Mango Kesari', category: 'Sweets & Beverages', price: 50, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_tn13', name: 'Jackfruit Jalebi', category: 'Sweets & Beverages', price: 65, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm3', quantity: 0.04 }] },
  { id: 'd_tn14', name: 'Kesar Rasgulla', category: 'Sweets & Beverages', price: 50, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm3', quantity: 0.03 }] },

  // 5. Lunch (Grand Royal Feast)
  { id: 'd_l1', name: 'Kesar Peni + Badam Milk', category: 'Sweets & Desserts', price: 90, recipe: [{ materialId: 'rm12', quantity: 0.15 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_l2', name: 'Matka Rajbhog', category: 'Sweets & Desserts', price: 80, recipe: [{ materialId: 'rm13', quantity: 0.05 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_l3', name: 'Kheer Kadam', category: 'Sweets & Desserts', price: 75, recipe: [{ materialId: 'rm13', quantity: 0.05 }] },
  { id: 'd_l4', name: 'Dry Fruit Katori', category: 'Sweets & Desserts', price: 110, recipe: [{ materialId: 'rm19', quantity: 0.05 }, { materialId: 'rm3', quantity: 0.02 }] },
  { id: 'd_l5', name: 'Ring Baklava', category: 'Sweets & Desserts', price: 120, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm14', quantity: 0.015 }] },
  { id: 'd_l6', name: 'Kaju Anjeer Roll', category: 'Sweets & Desserts', price: 95, recipe: [{ materialId: 'rm19', quantity: 0.04 }] },
  { id: 'd_l7', name: 'Godhi Lychee Angoor Jamun', category: 'Sweets & Desserts', price: 85, recipe: [{ materialId: 'rm13', quantity: 0.04 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_l8', name: 'Traditional Payasa', category: 'Sweets & Desserts', price: 65, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm3', quantity: 0.02 }] },
  { id: 'd_l9', name: 'Dark Chocolate Gourmet Icecream', category: 'Sweets & Desserts', price: 90, recipe: [{ materialId: 'rm12', quantity: 0.1 }] },
  { id: 'd_l10', name: 'Rachada Roti', category: 'Breads & Main Course', price: 40, recipe: [{ materialId: 'rm2', quantity: 0.07 }] },
  { id: 'd_l11', name: 'Home Style Mixed Sagu', category: 'Breads & Main Course', price: 85, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_l12', name: 'Neer Dosa', category: 'Breads & Main Course', price: 55, recipe: [{ materialId: 'rm1', quantity: 0.06 }] },
  { id: 'd_l13', name: 'Palak Puri', category: 'Breads & Main Course', price: 45, recipe: [{ materialId: 'rm2', quantity: 0.06 }, { materialId: 'rm15', quantity: 0.02 }] },
  { id: 'd_l14', name: 'Amritsari Channa Masala', category: 'Breads & Main Course', price: 110, recipe: [{ materialId: 'rm6', quantity: 0.08 }] },
  { id: 'd_l15', name: 'Two Layer Roti', category: 'Breads & Main Course', price: 35, recipe: [{ materialId: 'rm2', quantity: 0.06 }] },
  { id: 'd_l16', name: 'Methi Malai Matar', category: 'Breads & Main Course', price: 130, recipe: [{ materialId: 'rm15', quantity: 0.06 }, { materialId: 'rm11', quantity: 0.02 }] },
  { id: 'd_l17', name: 'Paneer Thalassery Biriyani in Clay Pot', category: 'Breads & Main Course', price: 190, recipe: [{ materialId: 'rm1', quantity: 0.12 }, { materialId: 'rm9', quantity: 0.08 }] },
  { id: 'd_l18', name: 'Hariyali Rice - Side', category: 'Breads & Main Course', price: 95, recipe: [{ materialId: 'rm1', quantity: 0.1 }, { materialId: 'rm18', quantity: 0.02 }] },
  { id: 'd_l19', name: 'Karela (Herekai) Crispy Fry', category: 'Breads & Main Course', price: 75, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_l20', name: 'Rajmadal Groundnut Palya', category: 'Breads & Main Course', price: 70, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_l21', name: 'Tangy Grape Gojju', category: 'Breads & Main Course', price: 65, recipe: [{ materialId: 'rm19', quantity: 0.05 }] },

  // 6. Dinner (Multi-Cuisine Extravaganza)
  { id: 'd_d1', name: 'Ferrero Rocher Milkshake', category: 'Milkshakes & Mocktails', price: 140, recipe: [{ materialId: 'rm12', quantity: 0.15 }] },
  { id: 'd_d2', name: 'Nutella Chocolate Milkshake', category: 'Milkshakes & Mocktails', price: 130, recipe: [{ materialId: 'rm12', quantity: 0.15 }] },
  { id: 'd_d3', name: 'Lychee Milkshake', category: 'Milkshakes & Mocktails', price: 110, recipe: [{ materialId: 'rm12', quantity: 0.15 }] },
  { id: 'd_d4', name: 'Sangria Fruit Mocktail', category: 'Milkshakes & Mocktails', price: 120, recipe: [{ materialId: 'rm19', quantity: 0.05 }] },
  { id: 'd_d5', name: 'Virgin Mango Margarita', category: 'Milkshakes & Mocktails', price: 110, recipe: [{ materialId: 'rm19', quantity: 0.05 }] },
  { id: 'd_d6', name: 'Raspberry Daiquiri', category: 'Milkshakes & Mocktails', price: 115, recipe: [{ materialId: 'rm19', quantity: 0.05 }] },
  { id: 'd_d7', name: 'Cranberry Mixer Mocktail', category: 'Milkshakes & Mocktails', price: 105, recipe: [{ materialId: 'rm19', quantity: 0.05 }] },
  { id: 'd_d8', name: 'Spicy Guava Mary', category: 'Milkshakes & Mocktails', price: 105, recipe: [{ materialId: 'rm19', quantity: 0.05 }] },
  { id: 'd_d12', name: 'Treat Paneer Coins', category: 'Finger Foods & Street Food', price: 120, recipe: [{ materialId: 'rm9', quantity: 0.08 }] },
  { id: 'd_d13', name: 'Cheese Potato Coins', category: 'Finger Foods & Street Food', price: 100, recipe: [{ materialId: 'rm16', quantity: 0.08 }] },
  { id: 'd_d14', name: 'Jalapeno Cheese Poppers', category: 'Finger Foods & Street Food', price: 115, recipe: [{ materialId: 'rm17', quantity: 0.05 }] },
  { id: 'd_d15', name: 'Pancharatna Pani Puri (5 Flavored Panis)', category: 'Finger Foods & Street Food', price: 85, recipe: [{ materialId: 'rm16', quantity: 0.05 }] },
  { id: 'd_d16', name: 'Bangalore Style Masala Puri', category: 'Finger Foods & Street Food', price: 65, recipe: [{ materialId: 'rm6', quantity: 0.04 }] },
  { id: 'd_d17', name: 'Laccha Alu Tikki Chaat', category: 'Finger Foods & Street Food', price: 75, recipe: [{ materialId: 'rm16', quantity: 0.08 }] },
  { id: 'd_d18', name: 'Tawa Grilled Pineapple Chaat', category: 'Finger Foods & Street Food', price: 80, recipe: [{ materialId: 'rm19', quantity: 0.08 }] },
  { id: 'd_d23', name: 'Cream of Badam Broccoli Soup', category: 'Savoury Spoon (Soups)', price: 95, recipe: [{ materialId: 'rm11', quantity: 0.02 }, { materialId: 'rm15', quantity: 0.06 }] },
  { id: 'd_d24', name: 'Sweet Pumpkin Soup', category: 'Savoury Spoon (Soups)', price: 85, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_d26', name: 'Turkish Kunafa', category: 'Fruit Mittai (Sweets)', price: 140, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm3', quantity: 0.04 }, { materialId: 'rm14', quantity: 0.015 }] },
  { id: 'd_d27', name: 'Authentic Turkish Delight', category: 'Fruit Mittai (Sweets)', price: 120, recipe: [{ materialId: 'rm3', quantity: 0.05 }] },
  { id: 'd_d28', name: 'Kesar Kalakand', category: 'Fruit Mittai (Sweets)', price: 90, recipe: [{ materialId: 'rm13', quantity: 0.05 }] },
  { id: 'd_d29', name: 'Cream Boat Pastry', category: 'Fruit Mittai (Sweets)', price: 85, recipe: [{ materialId: 'rm11', quantity: 0.02 }] },
  { id: 'd_d34', name: 'Tender Coconut Angoor Malai', category: 'Fruit Mittai (Sweets)', price: 125, recipe: [{ materialId: 'rm12', quantity: 0.1 }, { materialId: 'rm19', quantity: 0.03 }] },
  { id: 'd_d44', name: 'Classic Bruschetta', category: 'Global Cuisines (Roman)', price: 110, recipe: [{ materialId: 'rm2', quantity: 0.05 }, { materialId: 'rm17', quantity: 0.03 }] },
  { id: 'd_d45', name: 'Artisan Pasta (Red / White / Pink)', category: 'Global Cuisines (Roman)', price: 160, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm11', quantity: 0.02 }] },
  { id: 'd_d46', name: 'Pizza Margherita', category: 'Global Cuisines (Roman)', price: 180, recipe: [{ materialId: 'rm2', quantity: 0.1 }, { materialId: 'rm9', quantity: 0.05 }] },
  { id: 'd_d47', name: 'Baked Veg Lasagna', category: 'Global Cuisines (Roman)', price: 190, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm15', quantity: 0.06 }] },
  { id: 'd_d48', name: 'Crispy Falafel with Hummus', category: 'Global Cuisines (Roman)', price: 130, recipe: [{ materialId: 'rm6', quantity: 0.06 }] },
  { id: 'd_d49', name: 'Fragrant Jasmine Rice', category: 'Global Cuisines (Thai)', price: 140, recipe: [{ materialId: 'rm1', quantity: 0.1 }] },
  { id: 'd_d50', name: 'Thai Spicy Red / Green Curry', category: 'Global Cuisines (Thai)', price: 170, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_d51', name: 'Pan Fried Tibetan Dumplings', category: 'Global Cuisines (Tibetan)', price: 110, recipe: [{ materialId: 'rm15', quantity: 0.06 }, { materialId: 'rm2', quantity: 0.04 }] },
  { id: 'd_d53', name: 'Crunchy Tacos with Salsa', category: 'Global Cuisines (Mexican)', price: 125, recipe: [{ materialId: 'rm15', quantity: 0.06 }] },
  { id: 'd_d56', name: 'Burnt Garlic Veg Noodles', category: 'Global Cuisines (Chinese)', price: 140, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm8', quantity: 0.01 }] },
  { id: 'd_d60', name: 'Amritsari Kulcha', category: 'Mughals & Nawabs', price: 60, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm16', quantity: 0.03 }] },
  { id: 'd_d61', name: 'Nawabi Tawa Soft Naan', category: 'Mughals & Nawabs', price: 50, recipe: [{ materialId: 'rm2', quantity: 0.08 }, { materialId: 'rm10', quantity: 0.01 }] },
  { id: 'd_d64', name: 'Nargisi Kofta Curry', category: 'Mughals & Nawabs', price: 170, recipe: [{ materialId: 'rm9', quantity: 0.06 }, { materialId: 'rm15', quantity: 0.05 }] },
  { id: 'd_d65', name: 'Mughlai Paneer Shahi', category: 'Mughals & Nawabs', price: 180, recipe: [{ materialId: 'rm9', quantity: 0.1 }, { materialId: 'rm11', quantity: 0.02 }] },
  { id: 'd_d68', name: 'Murugan Star Idly', category: 'South Indian Specials', price: 50, recipe: [{ materialId: 'rm1', quantity: 0.06 }, { materialId: 'rm6', quantity: 0.02 }] },
  { id: 'd_d72', name: 'Mulbagal Crispy Dosa', category: 'South Indian Specials', price: 75, recipe: [{ materialId: 'rm1', quantity: 0.06 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_d73', name: 'Onion Ghee Dosa', category: 'South Indian Specials', price: 80, recipe: [{ materialId: 'rm1', quantity: 0.06 }, { materialId: 'rm14', quantity: 0.01 }] },
  { id: 'd_d81', name: 'Hyderabadi Cashew Biriyani', category: 'South Indian Specials', price: 210, recipe: [{ materialId: 'rm1', quantity: 0.12 }, { materialId: 'rm9', quantity: 0.05 }, { materialId: 'rm14', quantity: 0.015 }] },
  { id: 'd_d86', name: 'Live Podi Rice & Tokku Counter', category: 'South Indian Specials', price: 90, recipe: [{ materialId: 'rm1', quantity: 0.1 }, { materialId: 'rm4', quantity: 0.02 }] },
  { id: 'd_d91', name: 'Hariyali Kabab', category: 'Munchies & Salads', price: 110, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_d94', name: 'Kashmiri Kehwa Tea', category: 'Hot Beverages', price: 45, recipe: [{ materialId: 'rm7', quantity: 0.005 }] },
  { id: 'd_d98', name: 'Fresh Green Salad', category: 'Munchies & Salads', price: 45, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_d101', name: 'Greek Salad with Feta', category: 'Munchies & Salads', price: 75, recipe: [{ materialId: 'rm15', quantity: 0.08 }] },
  { id: 'd_d102', name: 'Red Velvet Cake Pastry', category: 'Desserts & Fruits', price: 85, recipe: [{ materialId: 'rm2', quantity: 0.04 }, { materialId: 'rm3', quantity: 0.03 }] },
  { id: 'd_d105', name: 'Imported Fruits Garden (Dragon, Kiwi, Plum)', category: 'Desserts & Fruits', price: 140, recipe: [{ materialId: 'rm19', quantity: 0.15 }] },
  { id: 'd_d107', name: 'Passion Fruit Gourmet Icecream', category: 'Desserts & Fruits', price: 90, recipe: [{ materialId: 'rm12', quantity: 0.1 }] },
  { id: 'd_d110', name: 'Mango Paan', category: 'Desserts & Fruits', price: 30, recipe: [] },
  { id: 'd_d111', name: 'Chocolate Paan', category: 'Desserts & Fruits', price: 35, recipe: [] },
  { id: 'd_d113', name: 'Fire Paan', category: 'Desserts & Fruits', price: 40, recipe: [] }
];

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
  { id: 'lw_5', name: 'Amit Patel', role: 'Kitchen Helper', phone: '+91 98980 44456', dailyRate: 750, agencyId: 'a2', type: 'Agency', status: 'Active' }
];

export const initialEvents = [
  {
    id: 'EV-2026-001',
    customer: { name: 'Venkatesh Reddy', phone: '+91 98765 11111', email: 'venkatesh.reddy@gmail.com' },
    eventType: 'Authentic Andhra Wedding Feast',
    venueId: 'v3',
    date: '2026-06-15',
    status: 'Completed',
    subFunctions: [
      { id: 'sf-1', name: 'Traditional Andhra Lunch', guestCount: 500, menuItems: ['d_a1', 'd_a2', 'd_a6', 'd_a8', 'd_a9', 'd_a10', 'd_a12', 'd_a15', 'd_a18', 'd_a20', 'd_a22', 'd_a24', 'd_a31', 'd_a36', 'd_a37'] }
    ],
    execution: {
      teamRoutes: { 'd_a1': 'internal', 'd_a2': 'outsourced', 'd_a9': 'internal', 'd_a10': 'internal', 'd_a15': 'agency' },
      dishStatuses: { 'd_a1': 'Served', 'd_a2': 'Served', 'd_a9': 'Served', 'd_a10': 'Served', 'd_a15': 'Served' },
      costs: { rawMaterialsCost: 185000, laborCost: 45000, venueRent: 200000, otherExpenses: 25000 }
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
    status: 'Confirmed',
    subFunctions: [
      { id: 'sf-2', name: 'Tamil Nadu Traditional Breakfast', guestCount: 300, menuItems: ['d_tn1', 'd_tn2', 'd_tn3', 'd_tn4', 'd_tn7', 'd_tn8', 'd_tn9', 'd_tn12', 'd_tn15'] },
      { id: 'sf-3', name: 'Evening High Tea & Refreshments', guestCount: 250, menuItems: ['d_s1', 'd_s2', 'd_s5', 'd_s8', 'd_s10', 'd_s12', 'd_s14'] }
    ],
    execution: {
      teamRoutes: { 'd_tn1': 'internal', 'd_tn2': 'internal', 'd_tn7': 'internal', 'd_s5': 'outsourced', 'd_s8': 'agency' },
      dishStatuses: { 'd_tn1': 'Preparing', 'd_tn2': 'Preparing', 'd_tn7': 'Preparing', 'd_s5': 'Pending', 'd_s8': 'Pending' },
      costs: { rawMaterialsCost: 120000, laborCost: 28000, venueRent: 150000, otherExpenses: 15000 }
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
    status: 'Inquiry',
    subFunctions: [
      { id: 'sf-4', name: 'Royal Rajasthani Banquet', guestCount: 400, menuItems: ['d_r1', 'd_r2', 'd_r3', 'd_r8', 'd_r9', 'd_r10', 'd_r13', 'd_r16', 'd_r19', 'd_r20', 'd_r21', 'd_r26', 'd_r28', 'd_r31', 'd_r39'] }
    ],
    execution: {
      teamRoutes: { 'd_r1': 'internal', 'd_r9': 'internal', 'd_r19': 'internal', 'd_r28': 'outsourced' },
      dishStatuses: { 'd_r1': 'Pending', 'd_r9': 'Pending', 'd_r19': 'Pending', 'd_r28': 'Pending' },
      costs: { rawMaterialsCost: 195000, laborCost: 48000, venueRent: 120000, otherExpenses: 20000 }
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
    id: 'EV-2026-004',
    customer: { name: 'Kavitha & Arvind Rao', phone: '+91 99887 66554', email: 'arvind.rao@techindia.io' },
    eventType: 'Grand Multi-Cuisine Extravaganza Dinner',
    venueId: 'v3',
    date: '2026-09-12',
    status: 'Confirmed',
    subFunctions: [
      { id: 'sf-5', name: 'Global Multi-Cuisine Gala Dinner', guestCount: 650, menuItems: ['d_d1', 'd_d4', 'd_d12', 'd_d15', 'd_d23', 'd_d26', 'd_d45', 'd_d47', 'd_d56', 'd_d64', 'd_d65', 'd_d81', 'd_d86', 'd_d102', 'd_d105', 'd_d110', 'd_d113'] }
    ],
    execution: {
      teamRoutes: { 'd_d15': 'agency', 'd_d26': 'outsourced', 'd_d45': 'internal', 'd_d65': 'internal', 'd_d81': 'internal' },
      dishStatuses: { 'd_d15': 'Pending', 'd_d26': 'Pending', 'd_d45': 'Pending', 'd_d65': 'Pending', 'd_d81': 'Pending' },
      costs: { rawMaterialsCost: 340000, laborCost: 85000, venueRent: 200000, otherExpenses: 40000 }
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
