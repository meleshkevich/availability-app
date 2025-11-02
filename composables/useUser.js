const useUser = () => {
  const { user } = useAuth();
  const { supabase } = useSupabase();

  const isAdmin = async () => {
    const userRole = await supabase
      .from("users")
      .select()
      .eq("user_id", user.value.id);

    return userRole;
  };

  const userData = async () => {
    const data = await supabase
      .from("users")
      .select()
      .eq("user_id", user.value.id);

    return {
      first_name: data.first_name,
      last_name: data.last_name,
    };
  };
  return {
    isAdmin,
    userData,
  };
};
export default useUser;
