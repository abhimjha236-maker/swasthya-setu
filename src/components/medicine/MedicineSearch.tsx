import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MedicineStock } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Search, 
  Pill, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  Calendar, 
  Layers, 
  List, 
  Grid, 
  Plus, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  Edit3,
  X,
  Package
} from 'lucide-react';

interface MedicineSearchProps {
  initialFacilityId?: string;
  defaultViewMode?: 'grouped' | 'table';
}

export const MedicineSearch: React.FC<MedicineSearchProps> = ({ 
  initialFacilityId,
  defaultViewMode = 'grouped' 
}) => {
  const { user } = useAuth();
  const { t, tStockStatus, language } = useLanguage();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [facilityFilter, setFacilityFilter] = useState<string>(initialFacilityId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'low_stock' | 'near_expiry' | 'out_of_stock' | 'available'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>(defaultViewMode);

  // Data States
  const [medicines, setMedicines] = useState<MedicineStock[]>([]);
  const [groupedMedicines, setGroupedMedicines] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total_records: 0,
    available_count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    near_expiry_count: 0,
    total_facilities_covered: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Stock Adjustment Modal States (for authorized PHC/DH/Admin users)
  const [selectedStockForUpdate, setSelectedStockForUpdate] = useState<MedicineStock | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editMinThreshold, setEditMinThreshold] = useState<number>(50);
  const [editBatch, setEditBatch] = useState<string>('');
  const [editExpiry, setEditExpiry] = useState<string>('');
  const [submittingUpdate, setSubmittingUpdate] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Add Medicine Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    medicine_name: '',
    generic_name: '',
    quantity: 100,
    unit: 'Tablets',
    batch_number: '',
    expiry_date: '',
    minimum_stock_level: 50,
    facility_id: user?.facility_id || 'FAC-PHC-01'
  });
  const [submittingAdd, setSubmittingAdd] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const isLowStock = quickFilter === 'low_stock';
      const isNearExpiry = quickFilter === 'near_expiry';
      const effectiveStatus = quickFilter === 'out_of_stock' ? 'Out of Stock' : (quickFilter === 'available' ? 'Available' : statusFilter);

      const res = await api.searchMedicines({
        query: searchTerm,
        facility_id: facilityFilter !== 'all' ? facilityFilter : undefined,
        status: effectiveStatus !== 'all' ? effectiveStatus : undefined,
        low_stock: isLowStock ? true : undefined,
        near_expiry: isNearExpiry ? true : undefined
      });

      if (res.success) {
        setMedicines(res.data || []);
        setGroupedMedicines(res.grouped || []);
        if (res.facilities) setFacilities(res.facilities);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Error loading medicine inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, facilityFilter, statusFilter, quickFilter]);

  // Check if current user is authorized to update a specific stock record
  const canUpdateStock = (item: MedicineStock) => {
    if (!user) return false;
    if (user.role === 'patient' || user.role === 'asha') return false;
    if (user.role === 'admin') return true;
    if (user.role === 'phc' || user.role === 'hospital') {
      const userFacility = user.facility_id || (user.role === 'phc' ? 'FAC-PHC-01' : 'FAC-DH-01');
      return item.facility_id === userFacility;
    }
    return false;
  };

  const canAddStock = user && (user.role === 'phc' || user.role === 'hospital' || user.role === 'admin');

  // Open Update Modal
  const handleOpenUpdate = (item: MedicineStock) => {
    setSelectedStockForUpdate(item);
    setEditQuantity(item.quantity);
    setEditMinThreshold(item.minimum_stock_level || item.min_threshold || 50);
    setEditBatch(item.batch_number || '');
    setEditExpiry(item.expiry_date || '');
    setUpdateError(null);
  };

  // Submit Stock Update
  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForUpdate) return;
    setSubmittingUpdate(true);
    setUpdateError(null);

    try {
      const res = await api.updateMedicineStock({
        stock_id: selectedStockForUpdate.id,
        new_quantity: Number(editQuantity),
        minimum_stock_level: Number(editMinThreshold),
        batch_number: editBatch,
        expiry_date: editExpiry
      });

      if (res.success) {
        setSelectedStockForUpdate(null);
        fetchInventory();
      } else {
        setUpdateError(res.message || 'Failed to update stock');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Network error updating stock');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  // Submit Add New Medicine
  const handleSaveNewMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    setAddError(null);

    try {
      const res = await api.addMedicineStock(addForm);
      if (res.success) {
        setShowAddModal(false);
        setAddForm({
          medicine_name: '',
          generic_name: '',
          quantity: 100,
          unit: 'Tablets',
          batch_number: '',
          expiry_date: '',
          minimum_stock_level: 50,
          facility_id: user?.facility_id || 'FAC-PHC-01'
        });
        fetchInventory();
      } else {
        setAddError(res.message || 'Failed to add medicine');
      }
    } catch (err: any) {
      setAddError(err.message || 'Network error adding medicine');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Projected status calculator for modal preview
  const getProjectedStatus = (qty: number, minLevel: number, expDateStr: string) => {
    if (qty === 0) return 'Out of Stock';
    if (expDateStr) {
      const expDate = new Date(expDateStr).getTime();
      const now = Date.now();
      const days = (expDate - now) / (1000 * 60 * 60 * 24);
      if (days <= 60) return 'Near Expiry';
    }
    if (qty <= minLevel) return 'Low Stock';
    return 'Available';
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Role Access Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Pill className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {t('med_title')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('med_subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Role Status Chip & Action */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              user?.role === 'patient' || user?.role === 'asha'
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-teal-50 border-teal-200 text-teal-800'
            }`}>
              {user?.role === 'patient' && <ShieldCheck className="w-4 h-4 text-slate-500" />}
              {user?.role === 'asha' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
              {(user?.role === 'phc' || user?.role === 'hospital') && <Edit3 className="w-4 h-4 text-teal-600" />}
              {user?.role === 'admin' && <Package className="w-4 h-4 text-blue-600" />}
              <span>
                {user?.role === 'patient' && t('med_access_patient')}
                {user?.role === 'asha' && t('med_access_asha')}
                {user?.role === 'phc' && t('med_access_phc')}
                {user?.role === 'hospital' && t('med_access_hospital')}
                {user?.role === 'admin' && t('med_access_admin')}
                {!user && t('med_access_public')}
              </span>
            </div>

            {canAddStock && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('med_add_batch_btn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. District Inventory KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              quickFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/30'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-[10px] uppercase font-bold opacity-75 block">{t('med_total_records')}</span>
            <div className="text-xl font-black mt-0.5">{metrics.total_records}</div>
            <span className="text-[10px] opacity-75">{metrics.total_facilities_covered} {t('med_total_facilities')}</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('available')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              quickFilter === 'available'
                ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-700/30'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">{tStockStatus('Available')}</span>
            <div className="text-xl font-black mt-0.5">{metrics.available_count}</div>
            <span className="text-[10px] text-emerald-700">{t('med_healthy_buffer')}</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('low_stock')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              quickFilter === 'low_stock'
                ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-600/30'
                : 'bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100/70'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-amber-700 block">{t('med_low_stock_alert')}</span>
            <div className="text-xl font-black mt-0.5">{metrics.low_stock_count}</div>
            <span className="text-[10px] text-amber-700">{t('med_below_min_level')}</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('out_of_stock')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              quickFilter === 'out_of_stock'
                ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-700/30'
                : 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-rose-700 block">{tStockStatus('Out of Stock')}</span>
            <div className="text-xl font-black mt-0.5">{metrics.out_of_stock_count}</div>
            <span className="text-[10px] text-rose-700">{t('med_zero_units')}</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickFilter('near_expiry')}
            className={`p-3.5 rounded-2xl border text-left transition-all col-span-2 sm:col-span-1 ${
              quickFilter === 'near_expiry'
                ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-600/30'
                : 'bg-orange-50/70 border-orange-200 text-orange-900 hover:bg-orange-100/70'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-orange-700 block">{tStockStatus('Near Expiry')}</span>
            <div className="text-xl font-black mt-0.5">{metrics.near_expiry_count}</div>
            <span className="text-[10px] text-orange-700">{t('med_within_60_days')}</span>
          </button>
        </div>

        {/* 3. Search and Multi-Filter Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={t('med_search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Facility Filter */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="w-full sm:w-56">
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{t('med_all_facilities')}</option>
                <option value="FAC-DH-01">District Hospital Bhopal</option>
                <option value="FAC-PHC-01">PHC Ratibad</option>
                <option value="FAC-PHC-02">PHC Berasia</option>
                <option value="FAC-PHC-03">PHC Phanda</option>
                <option value="FAC-SUB-01">Sub-Centre Barkheda</option>
              </select>
            </div>

            {/* Availability Status Filter */}
            <div className="w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setQuickFilter('all');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{t('med_all_statuses')}</option>
                <option value="Available">{tStockStatus('Available')}</option>
                <option value="Low Stock">{tStockStatus('Low Stock')}</option>
                <option value="Out of Stock">{tStockStatus('Out of Stock')}</option>
                <option value="Near Expiry">{tStockStatus('Near Expiry')}</option>
              </select>
            </div>

            {/* View Mode Toggle Button */}
            <div className="flex items-center border border-slate-200 bg-slate-50 rounded-2xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grouped by Medicine (Prompt UX)"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('med_view_grouped')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Detailed Stock Table"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('med_view_table')}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Results Presentation */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-teal-600" />
          <p className="font-semibold text-slate-600">{t('med_querying_stock')}</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
          <Pill className="w-10 h-10 mx-auto text-slate-300" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{t('med_no_matches')}</h4>
            <p className="text-slate-500 mt-0.5">
              {t('med_no_matches_desc')}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFacilityFilter('all');
              setStatusFilter('all');
              setQuickFilter('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            {t('med_reset_filters')}
          </button>
        </div>
      ) : viewMode === 'grouped' ? (
        
        /* ------------------------------------------------------------------------- */
        /* VIEW A: GROUPED MEDICINE CARDS (Prompt User Experience) */
        /* ------------------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedMedicines.map((group) => (
            <div 
              key={group.medicine_id || group.medicine_name}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-teal-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{group.medicine_name}</h3>
                    <p className="text-xs text-slate-500 italic mt-0.5">{group.generic_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-teal-700 block">{t('med_district_total')}</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {group.total_district_quantity} {group.unit || 'Units'}
                    </span>
                  </div>
                </div>

                {/* Facility-by-Facility Breakdown List */}
                <div className="space-y-2 pt-1">
                  {group.facilities.map((fac: any) => {
                    const stockRecord = medicines.find(m => m.id === fac.stock_id) || fac;
                    const canEdit = canUpdateStock(stockRecord);

                    return (
                      <div 
                        key={fac.stock_id || fac.facility_id}
                        className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-100/70 transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{fac.facility_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{t('med_batch_label')}: {fac.batch_number}</span>
                            <span>•</span>
                            <span>{t('med_exp_label')}: {formatDate(fac.expiry_date)}</span>
                            <span>•</span>
                            <span>{t('med_min_label')}: {fac.minimum_stock_level}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                          <span className="font-bold text-sm text-slate-900">
                            {fac.quantity} <span className="text-xs font-normal text-slate-500">{fac.unit}</span>
                          </span>

                          <StatusBadge status={fac.status} />

                          {canEdit && (
                            <button
                              onClick={() => handleOpenUpdate(stockRecord)}
                              className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-[11px] font-bold shadow-2xs"
                              title="Update Quantity or Restock"
                            >
                              {t('med_adjust_btn')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {language === 'hi' 
                    ? `${group.facilities.length} स्वास्थ्य केंद्र/केंद्रों में उपलब्ध` 
                    : `Available at ${group.facilities.length} facility/facilities`}
                </span>
                <span>{t('med_auto_calculated_rule')}</span>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* ------------------------------------------------------------------------- */
        /* VIEW B: DETAILED INVENTORY TABLE (All 10 required fields) */
        /* ------------------------------------------------------------------------- */
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <List className="w-4 h-4 text-teal-600" />
              {t('med_stock_register_title')} ({medicines.length} {t('med_total_records')})
            </h3>
            <span className="text-xs text-slate-500">
              {t('med_sorted_by')}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">{t('med_th_medicine')}</th>
                  <th className="p-3.5">{t('med_th_generic')}</th>
                  <th className="p-3.5">{t('med_th_facility')}</th>
                  <th className="p-3.5">{t('med_th_quantity')}</th>
                  <th className="p-3.5">{t('med_th_batch')}</th>
                  <th className="p-3.5">{t('med_th_expiry')}</th>
                  <th className="p-3.5">{t('med_th_min')}</th>
                  <th className="p-3.5">{t('med_th_updated')}</th>
                  <th className="p-3.5">{t('med_th_status')}</th>
                  <th className="p-3.5 text-right">{t('med_th_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((item) => {
                  const canEdit = canUpdateStock(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.medicine_name}
                      </td>
                      <td className="p-3.5 text-slate-500 italic">
                        {item.generic_name}
                      </td>
                      <td className="p-3.5 text-slate-800 font-medium">
                        {item.facility_name}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.quantity} <span className="text-slate-500 font-normal text-[11px]">{item.unit}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                        {item.batch_number}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {formatDate(item.expiry_date)}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {item.minimum_stock_level || item.min_threshold}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {formatDate(item.last_updated)}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {canEdit ? (
                          <button
                            onClick={() => handleOpenUpdate(item)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs border border-teal-200"
                          >
                            {t('med_update_stock_btn')}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">{t('med_view_only')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Stock Update Modal (Authorized Users) */}
      <Modal
        isOpen={selectedStockForUpdate !== null}
        onClose={() => setSelectedStockForUpdate(null)}
        title={`${t('med_modal_adjust_title')} — ${selectedStockForUpdate?.medicine_name}`}
        subtitle={`${t('med_th_facility')}: ${selectedStockForUpdate?.facility_name} | ${t('med_batch_label')}: ${selectedStockForUpdate?.batch_number}`}
        maxWidth="md"
      >
        {selectedStockForUpdate && (
          <form onSubmit={handleSaveStockUpdate} className="space-y-4 text-xs">
            
            {updateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {updateError}
              </div>
            )}

            {/* Quick Status Rule Preview */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('med_projected_status')}</span>
                <div className="mt-1">
                  <StatusBadge 
                    status={getProjectedStatus(editQuantity, editMinThreshold, editExpiry) as any} 
                  />
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <span>Rules: Qty=0 ➔ Out of Stock</span>
                <br />
                <span>Qty ≤ Min ➔ Low Stock</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('med_stock_qty')} ({selectedStockForUpdate.unit}) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('med_min_buffer')} *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editMinThreshold}
                  onChange={(e) => setEditMinThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('med_batch_no')}</label>
                <input
                  type="text"
                  value={editBatch}
                  onChange={(e) => setEditBatch(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('med_expiry_date')}</label>
                <input
                  type="date"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStockForUpdate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={submittingUpdate}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submittingUpdate ? t('med_saving_adjustment') : t('med_save_adjustment')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 6. Add New Medicine Batch Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('med_modal_add_title')}
        subtitle={t('med_modal_add_sub')}
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewMedicine} className="space-y-4 text-xs">
          {addError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {addError}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('med_target_facility')} *</label>
            <select
              value={addForm.facility_id}
              onChange={(e) => setAddForm({ ...addForm, facility_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="FAC-DH-01">Bhopal District Memorial Hospital</option>
              <option value="FAC-PHC-01">Primary Health Centre, Ratibad</option>
              <option value="FAC-PHC-02">Primary Health Centre, Berasia</option>
              <option value="FAC-PHC-03">Primary Health Centre, Phanda</option>
              <option value="FAC-SUB-01">Ayushman Arogya Mandir (Sub-Centre), Barkheda</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('med_brand_name')} *</label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 500mg"
                value={addForm.medicine_name}
                onChange={(e) => setAddForm({ ...addForm, medicine_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('med_th_generic')}</label>
              <input
                type="text"
                placeholder="e.g. Acetaminophen"
                value={addForm.generic_name}
                onChange={(e) => setAddForm({ ...addForm, generic_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('med_initial_qty')} *</label>
              <input
                type="number"
                min="0"
                required
                value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('med_unit_measurement')} *</label>
              <select
                value={addForm.unit}
                onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Tablets">Tablets</option>
                <option value="Strips">Strips</option>
                <option value="Vials">Vials</option>
                <option value="Inhalers">Inhalers</option>
                <option value="Sachets">Sachets</option>
                <option value="Bottles">Bottles</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('med_batch_no')} *</label>
              <input
                type="text"
                required
                placeholder="e.g. PCM-2026-05"
                value={addForm.batch_number}
                onChange={(e) => setAddForm({ ...addForm, batch_number: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('med_expiry_date')} *</label>
              <input
                type="date"
                required
                value={addForm.expiry_date}
                onChange={(e) => setAddForm({ ...addForm, expiry_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('med_min_threshold')}</label>
            <input
              type="number"
              min="1"
              value={addForm.minimum_stock_level}
              onChange={(e) => setAddForm({ ...addForm, minimum_stock_level: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submittingAdd ? t('med_adding_btn') : t('med_add_to_inventory_btn')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MedicineSearch;
