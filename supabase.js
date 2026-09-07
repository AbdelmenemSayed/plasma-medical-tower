/**
 * Plasma Medical Tower - Supabase Client Integration
 * Account Credentials: abdelmenem9sayed123@gmail.com
 */

const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";

// Initialize Supabase Client (if library imported via CDN or npm)
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("⚡ Supabase Client initialized successfully for Plasma Medical Tower.");
} else {
  console.log("ℹ️ Running in Standalone Frontend mode with IndexedDB/LocalStorage fallback.");
}

/**
 * Service Helper Methods for Plasma Medical Tower System
 */
const PlasmaService = {
  // Fetch Doctors List
  async getDoctors() {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('doctors').select('*');
      if (!error) return data;
    }
    return [
      { id: '1', name_ar: 'د. محمود الفقي', specialty: 'طب وجراحة الأسنان', fee: 300, rating: 4.9 },
      { id: '2', name_ar: 'د. أحمد صبري', specialty: 'عظام ومفاصل إصابات رياضة', fee: 350, rating: 4.8 },
      { id: '3', name_ar: 'د. سارة الحسيني', specialty: 'أمراض الباطنة والسكر', fee: 250, rating: 4.9 },
      { id: '4', name_ar: 'د. خالد عبد العزيز', specialty: 'الأشعة والتصوير التشخيصي', fee: 400, rating: 4.95 }
    ];
  },

  // Create New Appointment
  async createAppointment(appointmentData) {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('appointments').insert([appointmentData]);
      if (!error) return { success: true, data };
    }
    // Fallback Local Storage
    const existing = JSON.parse(localStorage.getItem('plasma_appointments') || '[]');
    existing.push({ ...appointmentData, id: 'PLZ-' + Math.floor(1000 + Math.random() * 9000), created_at: new Date() });
    localStorage.setItem('plasma_appointments', JSON.stringify(existing));
    return { success: true, message: 'حجز مؤكد محلياً (Local Mock Mode)' };
  },

  // Get Live Queue Tickets
  async getActiveQueue() {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('queue_tickets').select('*').eq('status', 'calling');
      if (!error) return data;
    }
    return [
      { ticket_number: 'A105', patient_name: 'محمد أحمد سعيد', clinic_room: 'عيادة 3 - أسنان' },
      { ticket_number: 'B204', patient_name: 'منى محمود حسن', clinic_room: 'عيادة 1 - عظام' },
      { ticket_number: 'C301', patient_name: 'علي عبد الله', clinic_room: 'معمل التحاليل' }
    ];
  }
};

window.PlasmaService = PlasmaService;
