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

  const resetNotes = () => {
    console.log('reset notes');
    (notesInput.sailing = ''),
      (notesInput.date = ''),
      (notesInput.service = '');
  };

  const fetchData = async () => {
    tableData.value = [];
    const notesResponse = await supabase.from('notes').select();
    // show all notes from DB
    notesResponse.data.forEach(async (el, i) => {
      const res = await supabase
        .from('users')
        .select()
        .eq('user_id', el.assigned_to);
      if (res.data) {
        const guideName = `${res.data[0].first_name} ${res.data[0].last_name}`;
        tableData.value.push({
          id: el.id,
          sailing: el.sailing,
          date: el.date,
          service: el.service,
          assigned_to: guideName,
        });
      } else {
        tableData.value.push({
          id: el.id,
          sailing: el.sailing,
          date: el.date,
          service: el.service,
          assigned_to: '',
        });
      }
    });
    return tableData.value;
  };

  return {
    notesInput,
    fetchData,
    resetNotes,
  };
});
