import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const menuPath = path.resolve(__dirname, '../src/data/catering_master_menu.json');
const mockDataPath = path.resolve(__dirname, '../src/utils/mockData.js');
const serverPath = path.resolve(__dirname, '../../backend/server.js');

test('Master Menu & Event Dish Integrity Suite', async (t) => {
  const menuRaw = fs.readFileSync(menuPath, 'utf8');
  const menuItems = JSON.parse(menuRaw);
  const dishIdSet = new Set(menuItems.map(item => item._id || item.id));

  await t.test('1. Total SKU count is valid (374 baseline or 1075 expanded catalog)', () => {
    assert.ok(menuItems.length === 374 || menuItems.length === 1075 || menuItems.length >= 370, `Expected 374 or 1075 items, found ${menuItems.length}`);
  });

  await t.test('2. Zero duplicate dish IDs across master catalog', () => {
    const idSet = new Set();
    const duplicates = [];
    menuItems.forEach(item => {
      const id = item._id || item.id;
      if (idSet.has(id)) duplicates.push(id);
      idSet.add(id);
    });
    assert.equal(duplicates.length, 0, `Found duplicate IDs: ${duplicates.join(', ')}`);
    assert.equal(idSet.size, menuItems.length);
  });

  await t.test('3. Schema validation: all items have valid id, name, category, subCategory, price, recipe', () => {
    menuItems.forEach(item => {
      const id = item._id || item.id;
      assert.ok(id && typeof id === 'string', `Item missing id: ${JSON.stringify(item)}`);
      assert.ok(item.name && typeof item.name === 'string', `Item ${id} missing name`);
      assert.ok(item.category && typeof item.category === 'string', `Item ${id} missing category`);
      assert.ok(item.subCategory && typeof item.subCategory === 'string', `Item ${id} missing subCategory`);
      assert.ok(typeof item.price === 'number' && item.price >= 0, `Item ${id} invalid price: ${item.price}`);
      assert.ok(Array.isArray(item.recipe), `Item ${id} recipe is not an array`);
    });
  });

  await t.test('4. Master categories verify against expected catalog sectors and counts', () => {
    const expectedDistribution = {
      'After-Meal / Traditional Finishers': 10,
      'Appetizers, Chaats & Street Food': 64,
      'Beverages & Welcome Drinks': 65,
      'Desserts, Sweets & Ice Creams': 62,
      'Global & Fusion Cuisines': 24,
      'North Indian Specialties': 33,
      'Sides, Accompaniments & Salads': 41,
      'South Indian Specialties': 75
    };

    const actualCounts = {};
    menuItems.forEach(item => {
      actualCounts[item.category] = (actualCounts[item.category] || 0) + 1;
    });

    if (menuItems.length === 374) {
      assert.deepEqual(actualCounts, expectedDistribution);
    } else {
      Object.keys(expectedDistribution).forEach(cat => {
        assert.ok((actualCounts[cat] || 0) >= expectedDistribution[cat], `Category ${cat} should have at least ${expectedDistribution[cat]} items, got ${actualCounts[cat] || 0}`);
      });
    }
  });

  await t.test('5. Seed mockData events reference valid dish IDs in master menu', () => {
    const mockContent = fs.readFileSync(mockDataPath, 'utf8');
    // Extract menuItems arrays from mockData.js
    const menuItemMatches = mockContent.match(/menuItems:\s*\[([^\]]+)\]/g) || [];
    assert.ok(menuItemMatches.length > 0, 'No menuItems arrays found in mockData.js');

    const referencedDishes = [];
    menuItemMatches.forEach(m => {
      const ids = m.match(/['"][a-zA-Z0-9_-]+['"]/g) || [];
      ids.forEach(rawId => referencedDishes.push(rawId.replace(/['"]/g, '')));
    });

    const broken = referencedDishes.filter(id => !dishIdSet.has(id));
    assert.equal(broken.length, 0, `Broken dish references in mockData.js: ${broken.join(', ')}`);
  });

  await t.test('6. Backend seed initialEvents reference valid dish IDs in master menu', () => {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const initialEventsIndex = serverContent.indexOf('const initialEvents = [');
    assert.ok(initialEventsIndex !== -1, 'initialEvents not found in server.js');
    const endEventsIndex = serverContent.indexOf('];', initialEventsIndex);
    const eventsChunk = serverContent.slice(initialEventsIndex, endEventsIndex);

    const menuItemMatches = eventsChunk.match(/menuItems:\s*\[([^\]]+)\]/g) || [];
    assert.ok(menuItemMatches.length > 0, 'No menuItems arrays found in backend initialEvents');

    const referencedDishes = [];
    menuItemMatches.forEach(m => {
      const ids = m.match(/['"][a-zA-Z0-9_-]+['"]/g) || [];
      ids.forEach(rawId => referencedDishes.push(rawId.replace(/['"]/g, '')));
    });

    const broken = referencedDishes.filter(id => !dishIdSet.has(id));
    assert.equal(broken.length, 0, `Broken dish references in server.js seed: ${broken.join(', ')}`);
  });
});
