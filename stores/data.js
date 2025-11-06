export const useDataStore = definePiniaStore('data-store', () => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { isAdmin, userData } = useUser();
  const tableData = ref([]);
  const notesInput = reactive({
    sailing: '',
    date: '',
    service: '',
  });

 
 const fetchData = async () => {
  tableData.value = [];

  // 1) тянем все сервисы
  const { data: services, error: e1 } = await supabase
    .from('services')
    .select('id, sailing, date, service, service_type_id, service_types(name)')
    .order('date', { ascending: true });

  if (e1) {
    console.error(e1);
    return [];
  }
  if (!services || !services.length) return [];

  // 2) подтверждённые назначения
  const svcIds = services.map(s => s.id);
  const { data: links, error: e2 } = await supabase
    .from('service_guides')
    .select('service_id, user_id, status')
    .in('service_id', svcIds)
    .eq('status', 'confirmed');

  if (e2) {
    console.error(e2);
  }

  // 3) user_meta для имён
  const userIds = Array.from(new Set((links || []).map(l => l.user_id))).filter(Boolean);
  const metaById = Object.create(null);
  if (userIds.length) {
    const { data: metas, error: e3 } = await supabase
      .from('user_meta')
      .select('user_id, display_name')
      .in('user_id', userIds);
    if (e3) console.error(e3);
    (metas || []).forEach(m => {
      metaById[m.user_id] = { display_name: m.display_name ?? null };
    });
  }

  // 4) собрать результат
  const confirmedBySvc = new Map();
  (links || []).forEach(l => confirmedBySvc.set(l.service_id, l.user_id));

  tableData.value = services.map(s => {
    const uid = confirmedBySvc.get(s.id);
    const guideName = uid ? (metaById[uid]?.display_name || '') : '';
    const serviceName = (s.service_types && s.service_types.name) ? s.service_types.name : (s.service || '');
    return {
      id: s.id,
      sailing: s.sailing,
      date: s.date,
      service: serviceName,
      assigned_to: guideName
    };
  });

  return tableData.value;
};

  return {
    notesInput,
    fetchData,
    
  };
});
