import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Referral, ReferralStatus, ReferralStatusHistory } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { VisualReferralTimeline } from './VisualReferralTimeline';
import { Modal } from '../common/Modal';
import { 
  Building2, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Truck, 
  Plus, 
  FileText, 
  Send, 
  AlertTriangle, 
  Eye, 
  CheckSquare, 
  HeartPulse, 
  User, 
  RefreshCw, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Stethoscope 
} from 'lucide-react';

interface ReferralTrackingEngineProps {
  userRole?: string;
  initialFilterStatus?: string;
  patientId?: string;
  isCompact?: boolean;
  onReferralUpdated?: () => void;
}

export const ReferralTrackingEngine: React.FC<ReferralTrackingEngineProps> = ({
  userRole,
  initialFilterStatus,
  patientId,
  isCompact = false,
  onReferralUpdated
}) => {
  const { user } = useAuth();
  const { t, tStatus, tPriority } = useLanguage();

  // State
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Referral for Full Dossier & Interactive Timeline
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Status Transition Modal State
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [referralForStatusUpdate, setReferralForStatusUpdate] = useState<Referral | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [appointmentSlot, setAppointmentSlot] = useState<string>('');
  const [assignedDoctor, setAssignedDoctor] = useState<string>('');
  const [submittingStatus, setSubmittingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Create Referral Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    patient_id: patientId || '',
    to_facility_id: 'FAC-DH-01',
    specialty_requested: 'Cardiology (2D Echo & Specialist Consultation)',
    referral_type: 'urgent',
    reason: '',
    clinical_summary: '',
    notes: '',
    preferred_date: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const [refRes, facRes] = await Promise.all([
        api.getReferrals({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          patient_id: patientId || undefined,
          query: searchTerm
        }),
        api.getMedicineFacilities()
      ]);

      if (refRes.success) {
        setReferrals(refRes.data || []);
      }
      if (facRes.success) {
        setFacilities(facRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientList = async () => {
    try {
      const res = await api.getPatients();
      if (res.success && res.data) {
        setPatientsList(res.data);
        if (!createForm.patient_id && res.data.length > 0) {
          setCreateForm(prev => ({ ...prev, patient_id: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [searchTerm, statusFilter, priorityFilter, facilityFilter]);

  useEffect(() => {
    if (user && (user.role === 'phc' || user.role === 'asha' || user.role === 'admin')) {
      fetchPatientList();
    }
  }, [user]);

  // Load audit history when dossier opens
  const handleOpenDossier = async (ref: Referral) => {
    setSelectedReferral(ref);
    setLoadingHistory(true);
    try {
      const res = await api.getReferral(ref.id);
      if (res.success && res.data?.history) {
        setReferralHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Status Transition Dialog
  const handleOpenStatusDialog = (ref: Referral, defaultTarget?: string) => {
    setReferralForStatusUpdate(ref);
    setTargetStatus(defaultTarget || ref.status);
    setStatusRemarks('');
    setAppointmentSlot(ref.appointment_date || '');
    setAssignedDoctor(ref.assigned_doctor_name || (user?.name || 'Dr. Specialist'));
    setStatusError(null);
    setStatusModalOpen(true);
  };

  // Submit Status Transition
  const handleSaveStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForStatusUpdate || !targetStatus) return;
    setSubmittingStatus(true);
    setStatusError(null);

    try {
      const res = await api.updateReferralStatus(referralForStatusUpdate.id, {
        status: targetStatus,
        remarks: statusRemarks || `Status transitioned to ${targetStatus} by ${user?.name}`,
        appointment_date: appointmentSlot || undefined,
        assigned_doctor_name: assignedDoctor || undefined,
        counter_referral_notes: statusRemarks || undefined
      });

      if (res.success) {
        setStatusModalOpen(false);
        setReferralForStatusUpdate(null);
        fetchReferrals();
        if (onReferralUpdated) onReferralUpdated();
        if (selectedReferral && selectedReferral.id === referralForStatusUpdate.id) {
          handleOpenDossier(res.data);
        }
      } else {
        setStatusError(res.message || 'Failed to update referral status');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Error communicating with referral engine');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Submit Create New Referral
  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    setCreateError(null);

    try {
      const res = await api.createReferral({
        patient_id: createForm.patient_id,
        to_facility_id: createForm.to_facility_id,
        specialty_requested: createForm.specialty_requested,
        referral_type: createForm.referral_type,
        reason: createForm.reason,
        clinical_summary: createForm.clinical_summary || createForm.notes,
        preferred_date: createForm.preferred_date || undefined
      });

      if (res.success) {
        setCreateModalOpen(false);
        setCreateForm({
          patient_id: patientsList.length > 0 ? patientsList[0].id : '',
          to_facility_id: 'FAC-DH-01',
          specialty_requested: 'Cardiology (2D Echo & Specialist Consultation)',
          referral_type: 'urgent',
          reason: '',
          clinical_summary: '',
          notes: '',
          preferred_date: ''
        });
        fetchReferrals();
        if (onReferralUpdated) onReferralUpdated();
      } else {
        setCreateError(res.message || 'Failed to create referral');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error creating referral');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Filtered dataset
  const filteredReferrals = referrals.filter(r => {
    if (facilityFilter === 'all') return true;
    return r.from_facility_id === facilityFilter || r.to_facility_id === facilityFilter;
  });

  const canCreateReferral = user && (user.role === 'phc' || user.role === 'asha' || user.role === 'admin');
  const isPatientView = user?.role === 'patient';

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {t('referrals', 'Inter-Facility Referral Tracking Engine')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('ref_track_sub', 'End-to-end continuous care pipeline from Village Sub-Centre ➔ PHC ➔ District Hospital')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateReferral && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('ref_new_btn', '+ Create Clinical Referral')}</span>
              </button>
            )}

            <button
              onClick={fetchReferrals}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title={t('refresh', 'Refresh Queue')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Filters & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('ref_search_placeholder', 'Search Referral ID, Patient, Reason...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter (9 Stages) */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">{t('ref_all_statuses', 'All Referral Statuses')}</option>
              <option value="Created">{tStatus('Created')}</option>
              <option value="Accepted">{tStatus('Accepted')}</option>
              <option value="Appointment Scheduled">{tStatus('Appointment Scheduled')}</option>
              <option value="In Transit">{tStatus('In Transit')}</option>
              <option value="Arrived">{tStatus('Arrived')}</option>
              <option value="Consultation Completed">{tStatus('Consultation Completed')}</option>
              <option value="Treatment Completed">{tStatus('Treatment Completed')}</option>
              <option value="Follow-up Required">{tStatus('Follow-up Required')}</option>
              <option value="Closed">{tStatus('Closed')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">{t('ref_all_priorities', 'All Priorities')}</option>
              <option value="routine">{tPriority('Routine')}</option>
              <option value="urgent">{tPriority('Urgent')}</option>
              <option value="emergency">{tPriority('Emergency')} (108 Ambulance)</option>
            </select>
          </div>

          {/* Facility Filter */}
          <div>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">{t('med_all_facilities', 'All Connected Facilities')}</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 3. Referral Records Register */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-teal-600" />
          <p className="font-semibold text-slate-600">{t('loading', 'Querying referral tracking engine...')}</p>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-slate-300" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{t('no_data', 'No referrals matching criteria')}</h4>
            <p className="text-slate-500 mt-0.5">{t('ref_search_placeholder', 'Try resetting search filters or creating a new referral.')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReferrals.map((ref) => {
            const isDestinationStaff = user?.facility_id === ref.to_facility_id || user?.role === 'hospital' || user?.role === 'admin';
            const isAsha = user?.role === 'asha';

            return (
              <div 
                key={ref.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-300 transition-all space-y-4"
              >
                {/* Referral Header Strip (Referral ID, Priority, Date, Status) */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">{ref.id}</span>
                    <StatusBadge status={ref.status} />
                    <StatusBadge status={ref.referral_type.toUpperCase()} isPriority={true} />
                    <span className="text-xs text-slate-400 font-medium">
                      {t('date', 'Initiated on')} {formatDate(ref.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDossier(ref)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs border border-blue-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('dh_details_timeline', 'View Dossier & Timeline')}</span>
                    </button>

                    {!isPatientView && (
                      <button
                        onClick={() => handleOpenStatusDialog(ref)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('dh_update_state', 'Update Status')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 10 Required Referral Fields Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  
                  {/* Patient Info */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t('role_patient', 'Patient')}</span>
                    <div className="font-bold text-slate-900 text-sm">{ref.patient_name}</div>
                    <div className="text-slate-500">
                      {ref.patient_age} Yrs ({ref.patient_gender}) • {ref.patient_village}
                    </div>
                    {ref.patient_abha && (
                      <div className="font-mono text-[11px] text-teal-800 font-semibold mt-0.5">
                        ABHA: {ref.patient_abha}
                      </div>
                    )}
                  </div>

                  {/* Inter-Facility Origin & Destination */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t('ref_origin_facility', 'Facility Route')}</span>
                    <div className="text-slate-800 font-medium">
                      <span className="text-slate-500">{t('ref_origin_facility', 'From')}:</span> {ref.from_facility_name}
                    </div>
                    <div className="text-teal-950 font-bold">
                      <span className="text-slate-500 font-normal">{t('ref_dest_facility', 'To')}:</span> {ref.to_facility_name}
                    </div>
                  </div>

                  {/* Specialty & Slot */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t('form_select_specialty', 'Specialty Requested')}</span>
                    <div className="font-bold text-teal-900">{ref.specialty_requested}</div>
                    <div className="text-slate-600 mt-0.5">
                      {ref.appointment_date ? (
                        <span className="text-blue-800 font-bold">{t('time', 'Slot')}: {formatDateTime(ref.appointment_date)}</span>
                      ) : (
                        <span className="italic text-slate-400">{t('pending', 'Pending Slot Scheduling')}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Stage Progression Buttons (Role specific) */}
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t('actions', 'Quick Progression')}</span>
                    
                    {isAsha && ref.status === 'Appointment Scheduled' && (
                      <button
                        onClick={() => handleOpenStatusDialog(ref, 'In Transit')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('dh_ambulance_tracked', 'Board Patient on 108 (Mark In Transit)')}</span>
                      </button>
                    )}

                    {isDestinationStaff && ref.status === 'Created' && (
                      <button
                        onClick={() => handleOpenStatusDialog(ref, 'Accepted')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('referral_status_accepted', 'Accept Inward Referral')}</span>
                      </button>
                    )}

                    {isDestinationStaff && ref.status === 'In Transit' && (
                      <button
                        onClick={() => handleOpenStatusDialog(ref, 'Arrived')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{t('referral_status_arrived', 'Confirm Hospital Arrival')}</span>
                      </button>
                    )}

                    {ref.status === 'Treatment Completed' && (
                      <span className="text-emerald-800 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {t('dh_discharges_delegated', 'Discharge completed & mapped to ASHA')}
                      </span>
                    )}

                    {ref.status === 'Closed' && (
                      <span className="text-slate-500 italic text-[11px]">{t('referral_status_closed', 'Care cycle concluded')}</span>
                    )}
                  </div>

                </div>

                {/* Clinical Indication & Notes */}
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-800 font-medium">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{t('referral_reason', 'Clinical Reason')}</span>
                    <p className="italic text-slate-700">{ref.reason}</p>
                  </div>
                  {ref.clinical_summary && (
                    <div className="text-slate-600 text-[11px] mt-1">
                      <strong>{t('telecon_tab_notes', 'Clinical Notes')}:</strong> {ref.clinical_summary}
                    </div>
                  )}
                  {ref.counter_referral_notes && (
                    <div className="p-2.5 mt-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 text-[11px]">
                      <strong>{t('form_followup_instructions', 'Specialist Counter-Referral Instructions')}:</strong> {ref.counter_referral_notes}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Referral Dossier & Visual Timeline Modal */}
      <Modal
        isOpen={selectedReferral !== null}
        onClose={() => setSelectedReferral(null)}
        title={`${t('ref_dossier_title', 'Referral Tracking Dossier')} — #${selectedReferral?.id}`}
        subtitle={`${t('ref_origin_facility', 'Origin')}: ${selectedReferral?.from_facility_name} ➔ ${selectedReferral?.to_facility_name}`}
        maxWidth="2xl"
      >
        {selectedReferral && (
          <div className="space-y-5 text-xs">
            
            {/* Embedded Visual 9-Stage Timeline */}
            <VisualReferralTimeline
              referral={selectedReferral}
              history={referralHistory}
              isEditable={!isPatientView}
              onStatusClick={(targetSt) => {
                handleOpenStatusDialog(selectedReferral, targetSt);
              }}
            />

            {/* Dossier Summary Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">{t('dh_details_timeline', 'Clinical Referral Details')}</span>
                <span className="text-slate-500">Created by: {selectedReferral.created_by_name || 'Medical Officer'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('role_patient', 'Patient')}</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedReferral.patient_name}</div>
                  <div className="text-slate-500">{selectedReferral.patient_village} • {selectedReferral.patient_mobile}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('form_select_specialty', 'Specialty')}</span>
                  <div className="font-bold text-teal-900 mt-0.5">{selectedReferral.specialty_requested}</div>
                  <div className="text-slate-500">{t('referral_priority', 'Priority')}: {tPriority(selectedReferral.referral_type)}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('time', 'Appointment Slot')}</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedReferral.appointment_date ? formatDateTime(selectedReferral.appointment_date) : t('pending', 'Pending Slot')}
                  </div>
                  <div className="text-slate-500">{selectedReferral.assigned_doctor_name || 'Doctor Unassigned'}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{t('referral_reason', 'Referral Indication')}</span>
                <p className="text-slate-800 italic">{selectedReferral.reason}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                {t('dh_close_dossier', 'Close Dossier')}
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* 5. Status Transition Dialog Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`${t('dh_update_state', 'Update Referral State')} — #${referralForStatusUpdate?.id}`}
        subtitle={`${t('role_patient', 'Patient')}: ${referralForStatusUpdate?.patient_name} | ${t('status', 'Current')}: ${tStatus(referralForStatusUpdate?.status || '')}`}
        maxWidth="md"
      >
        {referralForStatusUpdate && (
          <form onSubmit={handleSaveStatusTransition} className="space-y-4 text-xs">
            {statusError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {statusError}
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('dh_target_status', 'Target Status (9 Stages)')} *</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Created">{tStatus('Created')}</option>
                <option value="Accepted">{tStatus('Accepted')}</option>
                <option value="Appointment Scheduled">{tStatus('Appointment Scheduled')}</option>
                <option value="In Transit">{tStatus('In Transit')}</option>
                <option value="Arrived">{tStatus('Arrived')}</option>
                <option value="Consultation Completed">{tStatus('Consultation Completed')}</option>
                <option value="Treatment Completed">{tStatus('Treatment Completed')}</option>
                <option value="Follow-up Required">{tStatus('Follow-up Required')}</option>
                <option value="Closed">{tStatus('Closed')}</option>
              </select>
            </div>

            {targetStatus === 'Appointment Scheduled' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('time', 'Appointment Slot Time')} *</label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentSlot}
                  onChange={(e) => setAppointmentSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Clinician / Doctor</label>
              <input
                type="text"
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
                placeholder="e.g. Dr. Rajeshwari Sen (Chief Cardiologist)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('dh_transition_notes', 'Transition Remarks / Clinical Notes')} *</label>
              <textarea
                rows={3}
                required
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="Document clinical justification, ambulance details, diagnostic test results, or counter-referral instructions..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submittingStatus}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submittingStatus ? t('saving', 'Transitioning...') : `${t('dh_transition_to', 'Advance to')} ${tStatus(targetStatus)}`}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 6. Create Clinical Referral Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('ref_new_btn', 'Initiate Inter-Facility Clinical Referral')}
        subtitle="Automatic Referral ID Generation & Notification Dispatch"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {createError}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('role_patient', 'Select Patient')} *</label>
            <select
              value={createForm.patient_id}
              onChange={(e) => setCreateForm({ ...createForm, patient_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              {patientsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}Y/{p.gender}) — {t('form_patient_village', 'Village')}: {p.village} | ABHA: {p.abha_id || 'Unlinked'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('form_select_facility', 'Destination Facility')} *</label>
              <select
                value={createForm.to_facility_id}
                onChange={(e) => setCreateForm({ ...createForm, to_facility_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="FAC-DH-01">Bhopal District Memorial Hospital</option>
                <option value="FAC-PHC-01">Primary Health Centre, Ratibad</option>
                <option value="FAC-PHC-02">Primary Health Centre, Berasia</option>
                <option value="FAC-PHC-03">Primary Health Centre, Phanda</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('referral_priority', 'Clinical Priority')} *</label>
              <select
                value={createForm.referral_type}
                onChange={(e) => setCreateForm({ ...createForm, referral_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="routine">{tPriority('Routine')}</option>
                <option value="urgent">{tPriority('Urgent')}</option>
                <option value="emergency">{tPriority('Emergency')} (108 Ambulance)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('form_select_specialty', 'Specialty Requested')} *</label>
            <input
              type="text"
              required
              value={createForm.specialty_requested}
              onChange={(e) => setCreateForm({ ...createForm, specialty_requested: e.target.value })}
              placeholder="e.g. Cardiology (2D Echo & TMT), Pulmonology (CBNAAT)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('referral_reason', 'Reason for Referral')} *</label>
            <textarea
              rows={2}
              required
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              placeholder="Document primary clinical symptoms, diagnosis, and justification for higher centre care..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('telecon_tab_notes', 'Clinical Summary / Vitals Notes')}</label>
            <input
              type="text"
              value={createForm.clinical_summary}
              onChange={(e) => setCreateForm({ ...createForm, clinical_summary: e.target.value })}
              placeholder="BP: 160/100 mmHg, Pulse: 88, SpO2: 97%, on Amlodipine 5mg"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-4 h-4" />
              {submittingCreate ? t('saving', 'Initiating...') : t('submit', 'Generate Referral & Notify Facility')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ReferralTrackingEngine;
