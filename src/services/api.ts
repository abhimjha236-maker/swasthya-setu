const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('swasthya_setu_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('swasthya_setu_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('swasthya_setu_token');
  localStorage.removeItem('swasthya_setu_user');
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  getDemoCredentials: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-credentials`);
    return res.json();
  },

  sendOtp: async (mobile: string) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    return res.json();
  },

  login: async (credentials: { role: string; identifier: string; password?: string; otp?: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return res.json();
  },

  resetDemoData: async () => {
    const res = await fetch(`${API_BASE}/auth/reset-demo-data`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Patients
  getPatients: async (params?: { query?: string; village?: string; block?: string; abha_linked?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.village) queryParams.append('village', params.village);
    if (params?.block) queryParams.append('block', params.block);
    if (params?.abha_linked !== undefined) queryParams.append('abha_linked', String(params.abha_linked));

    const res = await fetch(`${API_BASE}/patients?${queryParams.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getPatient: async (id: string) => {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  registerPatient: async (patientData: any) => {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  linkAbha: async (patientId: string, payload: { aadhaar_number?: string; mobile_otp?: string }) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/link-abha`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  getPatientTimeline: async (patientId: string) => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/timeline`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Health Records
  createRecord: async (recordData: any) => {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(recordData)
    });
    return res.json();
  },

  getRecord: async (id: string) => {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Referrals
  getReferrals: async (params?: { status?: string; priority?: string; patient_id?: string; query?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id);
    if (params?.query) queryParams.append('query', params.query);

    const res = await fetch(`${API_BASE}/referrals?${queryParams.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getReferral: async (id: string) => {
    const res = await fetch(`${API_BASE}/referrals/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createReferral: async (payload: any) => {
    const res = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  updateReferralStatus: async (id: string, payload: any) => {
    const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Teleconsultations
  getTeleconsultations: async (params?: { status?: string; patient_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id);

    const res = await fetch(`${API_BASE}/teleconsultations?${queryParams.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getTeleconsultation: async (id: string) => {
    const res = await fetch(`${API_BASE}/teleconsultations/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  requestTeleconsultation: async (payload: any) => {
    const res = await fetch(`${API_BASE}/teleconsultations/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  completeTeleconsultation: async (id: string, payload: any) => {
    const res = await fetch(`${API_BASE}/teleconsultations/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Medicines
  searchMedicines: async (params?: { query?: string; facility_id?: string; status?: string; low_stock?: boolean | string; near_expiry?: boolean | string }) => {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.facility_id) queryParams.append('facility_id', params.facility_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.low_stock !== undefined) queryParams.append('low_stock', String(params.low_stock));
    if (params?.near_expiry !== undefined) queryParams.append('near_expiry', String(params.near_expiry));

    const res = await fetch(`${API_BASE}/medicines/search?${queryParams.toString()}`);
    return res.json();
  },

  getMedicineFacilities: async () => {
    const res = await fetch(`${API_BASE}/medicines/facilities`);
    return res.json();
  },

  getFacilityMedicines: async (facilityId: string) => {
    const res = await fetch(`${API_BASE}/medicines/facility/${facilityId}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateMedicineStock: async (payload: any) => {
    const res = await fetch(`${API_BASE}/medicines/stock-update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  addMedicineStock: async (payload: any) => {
    const res = await fetch(`${API_BASE}/medicines/add`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Analytics
  getDistrictAnalytics: async (params?: { date_range?: string; block?: string; phc_id?: string; village?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date_range) queryParams.append('date_range', params.date_range);
    if (params?.block) queryParams.append('block', params.block);
    if (params?.phc_id) queryParams.append('phc_id', params.phc_id);
    if (params?.village) queryParams.append('village', params.village);

    const res = await fetch(`${API_BASE}/analytics/overview?${queryParams.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Follow-ups
  getFollowUps: async (params?: { asha_id?: string; patient_id?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.asha_id) queryParams.append('asha_id', params.asha_id);
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id);
    if (params?.status) queryParams.append('status', params.status);

    const res = await fetch(`${API_BASE}/followups?${queryParams.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  completeFollowUp: async (id: string, payload: { completion_notes?: string; vitals?: any }) => {
    const res = await fetch(`${API_BASE}/followups/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    return res.json();
  },

  markNotificationRead: async (id: string) => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  markAllNotificationsRead: async () => {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  }
};
