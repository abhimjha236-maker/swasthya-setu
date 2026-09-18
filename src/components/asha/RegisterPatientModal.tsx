import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { UserPlus, ShieldCheck } from 'lucide-react';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultVillage?: string;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultVillage = 'Barkheda'
}) => {
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [mobile, setMobile] = useState<string>('');
  const [village, setVillage] = useState<string>(defaultVillage);
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('B+');
  const [chronicConditions, setChronicConditions] = useState<string>('');
  const [generateAbha, setGenerateAbha] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.registerPatient({
        name,
        age,
        gender,
        mobile,
        village,
        emergency_contact: emergencyContact,
        blood_group: bloodGroup,
        chronic_conditions: chronicConditions ? [chronicConditions] : [],
        generate_abha: generateAbha
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'hi' ? 'नया ग्रामीण नागरिक / मरीज़ पंजीकृत करें' : 'Register New Rural Citizen / Patient'}
      subtitle={language === 'hi' ? 'ग्राम स्वास्थ्य रजिस्टर में जोड़ें व डिजिटल आभा पहचान बनाएं' : 'Adds patient to village registry & creates digital health identity'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_patient_name', 'Full Name')} *
            </label>
            <input
              type="text"
              required
              placeholder={language === 'hi' ? 'उदा. मीरा बाई' : 'e.g. Meera Bai'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_patient_mobile', 'Mobile Number')} *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder={language === 'hi' ? '10-अंकों का मोबाइल नंबर' : '10-digit mobile'}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_patient_age', 'Age')} ({language === 'hi' ? 'वर्ष' : 'Years'}) *
            </label>
            <input
              type="number"
              required
              min={1}
              max={120}
              placeholder="e.g. 35"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_patient_gender', 'Gender')} *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Male">{language === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
              <option value="Female">{language === 'hi' ? 'महिला (Female)' : 'Female'}</option>
              <option value="Other">{language === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_patient_village', 'Gram Panchayat / Village')} *
            </label>
            <input
              type="text"
              required
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_patient_blood_group', 'Blood Group')}
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('form_patient_emergency', 'Emergency Contact')}
          </label>
          <input
            type="text"
            placeholder={language === 'hi' ? 'उदा. +91 9876543200 (रिश्तेदार का नाम)' : 'e.g. +91 9876543200 (Relative Name)'}
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('form_patient_conditions', 'Known Chronic Conditions / Health Notes')}
          </label>
          <input
            type="text"
            placeholder={language === 'hi' ? 'उदा. उच्च रक्तचाप, मधुमेह, मातृ ANC' : 'e.g. Hypertension, Diabetes, High-Risk Pregnancy ANC'}
            value={chronicConditions}
            onChange={(e) => setChronicConditions(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* ABDM ABHA generation checkbox */}
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <div>
              <div className="font-bold text-teal-950">
                {t('form_generate_abha', 'Auto-Generate ABDM ABHA ID')}
              </div>
              <div className="text-[11px] text-teal-700">
                {language === 'hi' ? '14-अंकों की राष्ट्रीय डिजिटल स्वास्थ्य पहचान बनाई जाएगी' : 'Creates simulated 14-digit government health identity'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={generateAbha}
            onChange={(e) => setGenerateAbha(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? t('saving', 'Registering...') : (language === 'hi' ? 'मरीज़ पंजीकृत करें' : 'Register Patient')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
