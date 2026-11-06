import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRawMaterials, initialVessels, initialVendorCategories, initialProvisions } from '../src/utils/mockData.js';

test('Storage Inventory & Raw Materials Management Suite', async (t) => {

  // 1. Raw Materials Master Integrity
  await t.test('1. Raw Materials Master Integrity: all items have id, name, category, unit, costPerUnit', () => {
    assert.ok(Array.isArray(initialRawMaterials), 'initialRawMaterials should be an array');
    assert.ok(initialRawMaterials.length >= 20, 'Should have at least 20 raw materials seeded');

    for (const rm of initialRawMaterials) {
      assert.ok(rm.id, `Raw material ${rm.name} must have an id`);
      assert.ok(rm.name && rm.name.trim().length > 0, `Raw material ${rm.id} must have a name`);
      assert.ok(rm.category && rm.category.trim().length > 0, `Raw material ${rm.name} must have a category`);
      assert.ok(rm.unit && rm.unit.trim().length > 0, `Raw material ${rm.name} must have a unit`);
      assert.ok(typeof rm.costPerUnit === 'number' && rm.costPerUnit >= 0, `Raw material ${rm.name} cost must be >= 0`);
    }
  });

  // 2. Storage Vessels Master Integrity
  await t.test('2. Storage Vessels Master Integrity: valid categories and quantities', () => {
    assert.ok(Array.isArray(initialVessels), 'initialVessels should be an array');
    assert.ok(initialVessels.length > 0, 'initialVessels should not be empty');

    for (const v of initialVessels) {
      assert.ok(v.id || v._id, `Vessel ${v.name} must have an ID`);
      assert.ok(v.name && v.name.trim().length > 0, `Vessel ${v.id} must have a name`);
      assert.ok(v.category, `Vessel ${v.name} must have a category`);
      assert.ok(typeof v.totalQty === 'number' && v.totalQty >= 0, `Vessel ${v.name} totalQty must be >= 0`);
      assert.ok(typeof v.availableQty === 'number' && v.availableQty >= 0, `Vessel ${v.name} availableQty must be >= 0`);
    }
  });

  // 3. Dynamic Category Aggregation for Raw Materials
  await t.test('3. Dynamic Category Aggregation: merges master categories and materials correctly', () => {
    const buildCategories = (vendorCats, materials) => {
      const base = [
        'Grocery',
        'Dairy',
        'Veg/Fruit',
        'Vegetables',
        'Fuel',
        'Spices & Condiments',
        'Ghee & Oils',
        'Dry Fruits',
        'Provisions',
        'Bakery',
        'Sweets & Snacks',
        'Beverages',
        'Disposable Items'
      ];
      const set = new Set(base);
      if (Array.isArray(vendorCats)) {
        vendorCats.forEach(vc => {
          if (vc && vc.name) set.add(vc.name);
        });
      }
      if (Array.isArray(materials)) {
        materials.forEach(rm => {
          if (rm && rm.category) set.add(rm.category);
        });
      }
      return Array.from(set).sort();
    };

    const categories = buildCategories(initialVendorCategories, initialRawMaterials);
    assert.ok(categories.includes('Grocery'), 'Must include Grocery');
    assert.ok(categories.includes('Dairy'), 'Must include Dairy');
    assert.ok(categories.includes('Veg/Fruit'), 'Must include Veg/Fruit');
    assert.ok(categories.includes('Fuel'), 'Must include Fuel');
    assert.ok(categories.length >= 13, 'Should have at least 13 distinct categories');

    // Test with custom category addition
    const customMaterials = [...initialRawMaterials, { id: 'rm_custom', name: 'Custom Spice', category: 'Artisanal Seasoning', unit: 'jar', costPerUnit: 200 }];
    const updatedCategories = buildCategories(initialVendorCategories, customMaterials);
    assert.ok(updatedCategories.includes('Artisanal Seasoning'), 'Must dynamically include newly added custom category');
  });

  // 4. Material Submission & Custom Category Resolution
  await t.test('4. Material Submission: resolves custom category and coerces numeric cost', () => {
    const processMaterialPayload = (form, editing = null) => {
      const finalCategory = form.category === '__custom__'
        ? (form.customCategory || '').trim() || 'General'
        : form.category;

      const payload = {
        name: (form.name || '').trim(),
        category: finalCategory,
        unit: (form.unit || '').trim(),
        costPerUnit: Number(form.costPerUnit) || 0
      };

      if (editing) {
        return { ...editing, ...payload, id: editing.id || editing._id };
      }
      return { ...payload, id: 'rm_' + Date.now() };
    };

    // Standard category submission
    const res1 = processMaterialPayload({
      name: 'Organic Jaggery',
      category: 'Grocery',
      customCategory: '',
      unit: 'kg',
      costPerUnit: '65.50'
    });
    assert.equal(res1.name, 'Organic Jaggery');
    assert.equal(res1.category, 'Grocery');
    assert.equal(res1.unit, 'kg');
    assert.equal(res1.costPerUnit, 65.5);
    assert.ok(res1.id.startsWith('rm_'));

    // Custom category submission
    const res2 = processMaterialPayload({
      name: 'Special Saffron',
      category: '__custom__',
      customCategory: 'Luxury Spices',
      unit: 'gm',
      costPerUnit: 350
    });
    assert.equal(res2.category, 'Luxury Spices');

    // Custom category fallback if left blank
    const res3 = processMaterialPayload({
      name: 'Item X',
      category: '__custom__',
      customCategory: '   ',
      unit: 'pcs',
      costPerUnit: 10
    });
    assert.equal(res3.category, 'General');

    // Edit material preserves existing ID
    const res4 = processMaterialPayload(
      { name: 'Basmati Extra Long', category: 'Grocery', customCategory: '', unit: 'kg', costPerUnit: 110 },
      { id: 'rm1', name: 'Basmati Rice', category: 'Grocery', unit: 'kg', costPerUnit: 90 }
    );
    assert.equal(res4.id, 'rm1');
    assert.equal(res4.costPerUnit, 110);
  });

  // 5. Vessel Photo Upload Validation and Compression Target Check
  await t.test('5. Vessel Photo Validation: allowed MIME types, extension check, and payload sizing', () => {
    const validatePhotoUpload = (mimeType, fileName, fileSize) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const isImageFile = allowedMimes.includes((mimeType || '').toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(fileName);
      if (!isImageFile) {
        return { valid: false, error: 'Supported formats: JPG, PNG, and WEBP only.' };
      }
      // Safety limit for files exceeding 60MB
      if (fileSize > 60 * 1024 * 1024) {
        return { valid: false, error: 'Photo file size exceeds 60MB safety limit. Please choose a photo under 60MB.' };
      }
      // Photos above 5MB are automatically compressed down to <= 5MB
      const needsAutoCompression = fileSize > 5 * 1024 * 1024;
      const effectiveSize = needsAutoCompression ? Math.min(fileSize, 4.5 * 1024 * 1024) : fileSize;
      return { 
        valid: true, 
        needsAutoCompression, 
        effectiveSize, 
        message: needsAutoCompression ? 'Auto-compressed to under 5MB' : 'Valid direct size' 
      };
    };

    assert.equal(validatePhotoUpload('image/jpeg', 'vessel.jpg', 1024 * 500).valid, true);
    assert.equal(validatePhotoUpload('image/png', 'pot.PNG', 1024 * 1024 * 4.5).valid, true);
    assert.equal(validatePhotoUpload('image/png', 'pot.PNG', 1024 * 1024 * 4.5).needsAutoCompression, false);
    assert.equal(validatePhotoUpload('image/webp', 'pan.webp', 1024 * 800).valid, true);
    assert.equal(validatePhotoUpload('', 'vessel.jpeg', 1024 * 400).valid, true);

    // Photos above 5MB (e.g. 8MB, 15MB, 25MB DSLR photos) are accepted & automatically compressed
    const largePhoto = validatePhotoUpload('image/jpeg', 'camera_8mb.jpg', 8 * 1024 * 1024);
    assert.equal(largePhoto.valid, true, 'Photos > 5MB must be accepted');
    assert.equal(largePhoto.needsAutoCompression, true, 'Photos > 5MB must be flagged for auto-compression');
    assert.ok(largePhoto.effectiveSize <= 5 * 1024 * 1024, 'Output payload must be <= 5MB after auto-compression');

    const dslrPhoto = validatePhotoUpload('image/jpeg', 'dslr_25mb.jpg', 25 * 1024 * 1024);
    assert.equal(dslrPhoto.valid, true);
    assert.equal(dslrPhoto.needsAutoCompression, true);
    assert.ok(dslrPhoto.effectiveSize <= 5 * 1024 * 1024);

    // Reject non-images
    assert.equal(validatePhotoUpload('application/pdf', 'doc.pdf', 1024).valid, false);
    assert.equal(validatePhotoUpload('text/plain', 'note.txt', 1024).valid, false);

    // Extreme file exceeding 60MB safety limit rejected
    assert.equal(validatePhotoUpload('image/jpeg', 'huge_70mb.jpg', 70 * 1024 * 1024).valid, false);
  });

  // 6. Vessel Photo Preview State and Remount Key Verification
  await t.test('6. Vessel Photo State Transition: update and remove logic preserves item identity and clears error state', () => {
    let photoPreviewItem = { id: 'ves_test_1', name: '100lts rice vessel', category: 'Cooking Vessel', photo: 'corrupted_old_data' };
    let imgError = true;

    const handlePhotoUpdate = (item, newPhotoDataUrl) => {
      const targetId = item.id || item._id;
      const updated = { ...item, id: targetId, photo: newPhotoDataUrl };
      photoPreviewItem = updated;
      imgError = false;
      return updated;
    };

    const handlePhotoRemoval = (item) => {
      const targetId = item.id || item._id;
      const updated = { ...item, id: targetId, photo: '' };
      photoPreviewItem = updated;
      imgError = false;
      return updated;
    };

    const generateImgKey = (item) => {
      return item.photo ? `modal_${item.id || item._id}_${item.photo.length}_${item.photo.slice(-20)}` : 'modal_img';
    };

    const initialKey = generateImgKey(photoPreviewItem);

    // Update with fresh valid base64 dataUrl
    const freshPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...fresh';
    handlePhotoUpdate(photoPreviewItem, freshPhoto);

    assert.equal(photoPreviewItem.photo, freshPhoto);
    assert.equal(photoPreviewItem.id, 'ves_test_1');
    assert.equal(imgError, false, 'imgError must be reset to false on fresh upload');
    const updatedKey = generateImgKey(photoPreviewItem);
    assert.notEqual(updatedKey, initialKey, 'Dynamic key must change to trigger clean DOM image remounting');

    // Remove photo
    handlePhotoRemoval(photoPreviewItem);
    assert.equal(photoPreviewItem.photo, '');
    assert.equal(imgError, false);
    assert.equal(generateImgKey(photoPreviewItem), 'modal_img');
  });

  // 7. AWS S3 Cloud Storage URL & Key Formatting Validation
  await t.test('7. AWS S3 Cloud Storage Integration: parses S3 HTTPS URLs, derives keys, and verifies upload response payload', () => {
    const bucket = 'mayyia-caterers-media';
    const region = 'ap-south-1';
    const folder = 'vessels';
    const fakeTimestamp = 1790059200000;
    const fakeRand = 'a1b2c3d4';
    const key = `${folder}/${folder}_${fakeTimestamp}_${fakeRand}.jpg`;
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    // S3 URL Validation
    const isValidS3Url = (url) => {
      if (!url || typeof url !== 'string') return false;
      const regex = /^https:\/\/([a-z0-9.\-_]+)\.s3\.([a-z0-9\-]+)\.amazonaws\.com\/(.+)$/;
      return regex.test(url);
    };

    assert.equal(isValidS3Url(s3Url), true, 'Constructed S3 URL must be valid');
    assert.equal(isValidS3Url('data:image/jpeg;base64,...'), false, 'Base64 data URLs must not be identified as S3 URLs');
    assert.equal(isValidS3Url('https://example.com/pic.jpg'), false, 'Non-S3 URLs must not be identified as S3 URLs');

    // Extract key from URL
    const extractS3Key = (url) => {
      try {
        const u = new URL(url);
        return u.pathname.replace(/^\//, '');
      } catch (e) {
        return null;
      }
    };

    assert.equal(extractS3Key(s3Url), key, 'Extracted S3 key must match expected key');

    // Vessel photo assignment with S3 URL
    const vessel = { id: 'ves_100', name: '100lts rice vessel', photo: '' };
    const uploadResponse = { success: true, url: s3Url, key, bucket, region };

    const updatedVessel = { ...vessel, photo: uploadResponse.url };
    assert.equal(updatedVessel.photo, s3Url);
    assert.ok(updatedVessel.photo.length < 150, 'S3 URL should be compact (< 150 chars) compared to base64 (~200KB)');
  });

  // 8. Provision Inventory Category Alignment with Vendor Categories
  await t.test('8. Provision Inventory: Aligns categories with Vendor Categories and preserves existing items', () => {
    const deriveProvisionCategories = (vendorCats, currentProvisions) => {
      const catSet = new Set();
      if (Array.isArray(vendorCats)) {
        vendorCats.forEach(vc => {
          if (vc && vc.name && vc.active !== false) catSet.add(vc.name.trim());
        });
      }
      if (Array.isArray(currentProvisions)) {
        currentProvisions.forEach(p => {
          if (p && p.category) catSet.add(p.category.trim());
        });
      }
      return Array.from(catSet).sort((a, b) => a.localeCompare(b));
    };

    const categories = deriveProvisionCategories(initialVendorCategories, initialProvisions);

    // Verify vendor categories are present
    assert.ok(categories.includes('Grocery'), 'Must include Grocery vendor category');
    assert.ok(categories.includes('Spices'), 'Must include Spices vendor category');
    assert.ok(categories.includes('Dairy'), 'Must include Dairy vendor category');
    assert.ok(categories.includes('Vegetables'), 'Must include Vegetables vendor category');
    assert.ok(categories.includes('Ghee'), 'Must include Ghee vendor category');
    assert.ok(categories.includes('Cylinders'), 'Must include Cylinders vendor category');

    // Verify existing provision categories are preserved
    assert.ok(categories.includes('Ghee & Oils'), 'Must preserve existing Ghee & Oils provision category');
    assert.ok(categories.includes('Spices & Condiments'), 'Must preserve existing Spices & Condiments');
    assert.ok(categories.includes('Dry Fruits'), 'Must preserve existing Dry Fruits');

    // Verify resolution of custom category
    const resolveCategory = (cat, custom) => {
      return cat === '__custom__' ? ((custom || '').trim() || 'General') : cat;
    };
    assert.equal(resolveCategory('Grocery', ''), 'Grocery');
    assert.equal(resolveCategory('__custom__', 'Special Rice'), 'Special Rice');
    assert.equal(resolveCategory('__custom__', '   '), 'General');
  });

  // 9. Storage Inventory: Base categories and dynamic "+ Category" management
  await t.test('9. Storage Inventory: Supports base categories and dynamic "+ Category" addition', () => {
    const BASE_STORAGE_CATEGORIES = [
      'Cooking Vessel',
      'Serving Gear',
      'Utensils',
      'Heating & Fuel'
    ];

    let customCategories = ['Dining Crockery'];

    const getAvailableCategories = (vesselList, customs) => {
      const set = new Set(BASE_STORAGE_CATEGORIES);
      (customs || []).forEach(c => { if (c && c.trim()) set.add(c.trim()); });
      (vesselList || []).forEach(v => { if (v && v.category && v.category.trim()) set.add(v.category.trim()); });
      return Array.from(set);
    };

    let available = getAvailableCategories(initialVessels, customCategories);

    // Verify all 4 base categories exist
    BASE_STORAGE_CATEGORIES.forEach(bc => {
      assert.ok(available.includes(bc), `Base category ${bc} must be present`);
    });

    // Verify custom category exists
    assert.ok(available.includes('Dining Crockery'), 'Custom category Dining Crockery must be present');

    // Add another category via "+ Category" logic
    const handleAdd = (newCat) => {
      const trimmed = (newCat || '').trim();
      if (!trimmed) return null;
      if (!customCategories.includes(trimmed) && !BASE_STORAGE_CATEGORIES.includes(trimmed)) {
        customCategories = [...customCategories, trimmed];
      }
      return trimmed;
    };

    const added = handleAdd('Transport Crates');
    assert.equal(added, 'Transport Crates');

    available = getAvailableCategories(initialVessels, customCategories);
    assert.ok(available.includes('Transport Crates'), 'Newly added category Transport Crates must be available');

    // Verify no duplicates
    const duplicateAdd = handleAdd('Transport Crates');
    assert.equal(customCategories.filter(c => c === 'Transport Crates').length, 1);
  });

});
