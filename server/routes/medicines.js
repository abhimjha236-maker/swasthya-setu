import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Compute medicine stock status based on clinical inventory rules:
 * - If quantity === 0: 'Out of Stock'
 * - If expiry is approaching (within 60 days or past date): 'Near Expiry'
 * - If quantity <= minimum_stock_level: 'Low Stock'
 * - Otherwise: 'Available'
 */
export function computeMedicineStatus(item) {
  const qty = Number(item.quantity) !== undefined && !isNaN(Number(item.quantity)) ? Number(item.quantity) : 0;
  const minThreshold = item.minimum_stock_level !== undefined && !isNaN(Number(item.minimum_stock_level))
    ? Number(item.minimum_stock_level)
    : (item.min_threshold !== undefined && !isNaN(Number(item.min_threshold)) ? Number(item.min_threshold) : 50);

  // 1. Out of Stock rule
  if (qty === 0) {
    return 'Out of Stock';
  }

  // 2. Near Expiry rule (within 60 days of current date or past date)
  if (item.expiry_date) {
    const expDate = new Date(item.expiry_date).getTime();
    const now = Date.now();
    const daysUntilExpiry = (expDate - now) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 60) {
      return 'Near Expiry';
    }
  }

  // 3. Low Stock rule
  if (qty <= minThreshold) {
    return 'Low Stock';
  }

  // 4. Default available
  return 'Available';
}

// Get all facilities with medicine stock for facility filters
router.get('/facilities', (req, res) => {
  const facilities = db.getCollection('facilities');
  res.json({
    success: true,
    total: facilities.length,
    data: facilities
  });
});

// Search medicine availability across all facilities in district
router.get('/search', (req, res) => {
  const { query, facility_id, category, status, low_stock, near_expiry } = req.query;

  let stockList = db.getCollection('medicine_stock').map(s => {
    const computed = computeMedicineStatus(s);
    return {
      ...s,
      minimum_stock_level: s.minimum_stock_level !== undefined ? s.minimum_stock_level : (s.min_threshold || 50),
      min_threshold: s.minimum_stock_level !== undefined ? s.minimum_stock_level : (s.min_threshold || 50),
      status: computed
    };
  });

  // Query search (medicine name, generic name, facility name, batch number)
  if (query) {
    const q = query.trim().toLowerCase();
    stockList = stockList.filter(s => 
      (s.medicine_name && s.medicine_name.toLowerCase().includes(q)) ||
      (s.generic_name && s.generic_name.toLowerCase().includes(q)) ||
      (s.facility_name && s.facility_name.toLowerCase().includes(q)) ||
      (s.batch_number && s.batch_number.toLowerCase().includes(q))
    );
  }

  // Facility filter
  if (facility_id && facility_id !== 'all') {
    stockList = stockList.filter(s => s.facility_id === facility_id);
  }

  // Low Stock filter
  if (low_stock === 'true' || low_stock === '1') {
    stockList = stockList.filter(s => s.status === 'Low Stock' || s.quantity <= (s.minimum_stock_level || s.min_threshold || 50));
  }

  // Near Expiry filter
  if (near_expiry === 'true' || near_expiry === '1') {
    stockList = stockList.filter(s => s.status === 'Near Expiry');
  }

  // Status filter
  if (status && status !== 'all') {
    stockList = stockList.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }

  // Calculate grouped view: Medicine name -> Array of facility stocks (matching user prompt example)
  const grouped = {};
  stockList.forEach(item => {
    if (!grouped[item.medicine_name]) {
      grouped[item.medicine_name] = {
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        generic_name: item.generic_name,
        total_district_quantity: 0,
        unit: item.unit,
        facilities: []
      };
    }
    grouped[item.medicine_name].total_district_quantity += item.quantity;
    grouped[item.medicine_name].facilities.push({
      stock_id: item.id,
      facility_id: item.facility_id,
      facility_name: item.facility_name,
      quantity: item.quantity,
      unit: item.unit,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      minimum_stock_level: item.minimum_stock_level || item.min_threshold,
      status: item.status,
      last_updated: item.last_updated
    });
  });

  // Calculate high-level district inventory metrics
  const allCurrentStock = db.getCollection('medicine_stock').map(s => computeMedicineStatus(s));
  const metrics = {
    total_records: stockList.length,
    available_count: stockList.filter(s => s.status === 'Available').length,
    low_stock_count: stockList.filter(s => s.status === 'Low Stock').length,
    out_of_stock_count: stockList.filter(s => s.status === 'Out of Stock').length,
    near_expiry_count: stockList.filter(s => s.status === 'Near Expiry').length,
    total_facilities_covered: new Set(stockList.map(s => s.facility_id)).size
  };

  const facilities = db.getCollection('facilities');

  res.json({
    success: true,
    total_records: stockList.length,
    metrics,
    facilities,
    data: stockList,
    grouped: Object.values(grouped)
  });
});

// Get stock for a specific facility
router.get('/facility/:facilityId', authenticateToken, (req, res) => {
  const { facilityId } = req.params;
  const stockList = db.find('medicine_stock', s => s.facility_id === facilityId).map(s => {
    const computed = computeMedicineStatus(s);
    return {
      ...s,
      minimum_stock_level: s.minimum_stock_level !== undefined ? s.minimum_stock_level : (s.min_threshold || 50),
      min_threshold: s.minimum_stock_level !== undefined ? s.minimum_stock_level : (s.min_threshold || 50),
      status: computed
    };
  });

  res.json({
    success: true,
    facility_id: facilityId,
    total: stockList.length,
    data: stockList
  });
});

// Update medicine stock (Restock or adjust quantity - PHC/Hospital/Admin only)
const handleStockUpdate = (req, res) => {
  // 1. Role-Based Permissions Enforcement: Patients & ASHAs are View-Only
  if (req.user.role === 'patient' || req.user.role === 'asha') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access Denied: Patients and ASHA workers have view-only access to medicine inventory.' 
    });
  }

  const { stock_id, quantity_change, new_quantity, batch_number, expiry_date, min_threshold, minimum_stock_level } = req.body;

  if (!stock_id) {
    return res.status(400).json({ success: false, message: 'Stock ID is required for updating inventory' });
  }

  const stockItem = db.findById('medicine_stock', stock_id);
  if (!stockItem) {
    return res.status(404).json({ success: false, message: 'Medicine stock item not found' });
  }

  // 2. Facility Scoping: PHC & Hospital can only update their own facility stock
  if (req.user.role === 'phc' || req.user.role === 'hospital') {
    const userFacility = req.user.facility_id || (req.user.role === 'phc' ? 'FAC-PHC-01' : 'FAC-DH-01');
    if (stockItem.facility_id !== userFacility) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: You are only authorized to update stock for your assigned facility (${userFacility}).`
      });
    }
  }

  // 3. Compute new quantity
  let finalQty = stockItem.quantity;
  if (new_quantity !== undefined) {
    finalQty = Math.max(0, Number(new_quantity));
  } else if (quantity_change !== undefined) {
    finalQty = Math.max(0, finalQty + Number(quantity_change));
  }

  const finalMinThreshold = minimum_stock_level !== undefined 
    ? Number(minimum_stock_level) 
    : (min_threshold !== undefined ? Number(min_threshold) : (stockItem.minimum_stock_level || stockItem.min_threshold || 50));

  const finalExpiryDate = expiry_date || stockItem.expiry_date;
  const finalBatchNumber = batch_number || stockItem.batch_number;

  // 4. Automatically calculate new status based on rules
  const tempItem = {
    ...stockItem,
    quantity: finalQty,
    minimum_stock_level: finalMinThreshold,
    min_threshold: finalMinThreshold,
    expiry_date: finalExpiryDate
  };
  const computedStatus = computeMedicineStatus(tempItem);

  const updates = {
    quantity: finalQty,
    minimum_stock_level: finalMinThreshold,
    min_threshold: finalMinThreshold,
    batch_number: finalBatchNumber,
    expiry_date: finalExpiryDate,
    status: computedStatus,
    last_updated: new Date().toISOString()
  };

  const updatedStock = db.update('medicine_stock', stockItem.id, updates);

  // 5. Generate Admin/Facility Notification if Low Stock or Out of Stock
  if (computedStatus === 'Out of Stock' || computedStatus === 'Low Stock' || computedStatus === 'Near Expiry') {
    db.insert('notifications', {
      id: `NOTIF-${Date.now()}`,
      role_target: 'admin',
      title: `Medicine Alert: ${stockItem.medicine_name} (${computedStatus})`,
      message: `${stockItem.medicine_name} is marked '${computedStatus}' at ${stockItem.facility_name} (${finalQty} ${stockItem.unit} remaining, Min: ${finalMinThreshold}).`,
      type: computedStatus === 'Out of Stock' ? 'alert' : 'warning',
      is_read: false,
      link_url: '/admin/dashboard',
      created_at: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: `Stock updated for ${stockItem.medicine_name}. New balance: ${finalQty} ${stockItem.unit} (${computedStatus})`,
    data: updatedStock
  });
};

// Add new medicine stock record to a facility
router.post('/add', authenticateToken, (req, res) => {
  if (req.user.role === 'patient' || req.user.role === 'asha') {
    return res.status(403).json({ 
      success: false, 
      message: 'Patients and ASHA workers have view-only access to medicine inventory.' 
    });
  }

  const {
    medicine_name,
    generic_name,
    quantity,
    unit,
    batch_number,
    expiry_date,
    minimum_stock_level,
    facility_id
  } = req.body;

  if (!medicine_name || quantity === undefined || !unit || !batch_number || !expiry_date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide Medicine Name, Quantity, Unit, Batch Number, and Expiry Date'
    });
  }

  let targetFacilityId = facility_id;
  if (req.user.role === 'phc' || req.user.role === 'hospital') {
    targetFacilityId = req.user.facility_id || (req.user.role === 'phc' ? 'FAC-PHC-01' : 'FAC-DH-01');
  }

  const facility = db.findById('facilities', targetFacilityId) || { name: 'Health Facility' };

  const qty = Math.max(0, Number(quantity));
  const minStock = Number(minimum_stock_level) || 50;

  const newItem = {
    id: `STK-${Date.now()}`,
    facility_id: targetFacilityId,
    facility_name: facility.name,
    medicine_id: `MED-${Date.now()}`,
    medicine_name: medicine_name.trim(),
    generic_name: generic_name ? generic_name.trim() : medicine_name.trim(),
    quantity: qty,
    unit: unit.trim(),
    batch_number: batch_number.trim(),
    expiry_date: expiry_date,
    minimum_stock_level: minStock,
    min_threshold: minStock,
    status: 'Available',
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  newItem.status = computeMedicineStatus(newItem);

  db.insert('medicine_stock', newItem);

  res.status(201).json({
    success: true,
    message: `Medicine ${newItem.medicine_name} successfully added to ${facility.name} inventory.`,
    data: newItem
  });
});

router.post('/stock-update', authenticateToken, handleStockUpdate);
router.post('/stock', authenticateToken, handleStockUpdate);
router.patch('/stock', authenticateToken, handleStockUpdate);
router.put('/stock', authenticateToken, handleStockUpdate);
router.patch('/:id', authenticateToken, (req, res) => {
  req.body.stock_id = req.params.id;
  handleStockUpdate(req, res);
});
router.put('/:id', authenticateToken, (req, res) => {
  req.body.stock_id = req.params.id;
  handleStockUpdate(req, res);
});

export default router;
