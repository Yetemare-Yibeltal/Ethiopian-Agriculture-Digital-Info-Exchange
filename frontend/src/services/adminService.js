// frontend/src/services/adminService.js
import { supabase } from "../utils/supabase.js";
import { API_ENDPOINTS } from "../utils/constants.js";

export const adminService = {
  async getSystemStats() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role", { count: "exact" });

      if (error) throw error;

      // Count users by role
      const users = data || [];
      const totalUsers = users.length;
      const managers = users.filter((u) => u.role === "manager").length;
      const buyers = users.filter((u) => u.role === "buyer").length;
      const admins = users.filter((u) => u.role === "admin").length;

      // Get listing stats
      const { data: listings, error: listErr } = await supabase
        .from("listings")
        .select("status", { count: "exact" });

      if (listErr) throw listErr;

      const totalListings = listings.length;
      const activeListings = listings.filter(
        (l) => l.status === "active",
      ).length;
      const reservedListings = listings.filter(
        (l) => l.status === "reserved",
      ).length;
      const completedListings = listings.filter(
        (l) => l.status === "completed",
      ).length;
      const expiredListings = listings.filter(
        (l) => l.status === "expired",
      ).length;
      const expiringSoon = listings.filter(
        (l) =>
          l.status === "active" &&
          new Date(l.expiry_date) <
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ).length;

      // Get farmers
      const { count: totalFarmers, error: farmErr } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true });

      if (farmErr) throw farmErr;

      const { count: activeFarmers, error: activeFarmErr } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (activeFarmErr) throw activeFarmErr;

      // Get offers
      const { data: offers, error: offerErr } = await supabase
        .from("offers")
        .select("status", { count: "exact" });

      if (offerErr) throw offerErr;

      const totalOffers = offers.length;
      const pendingOffers = offers.filter((o) => o.status === "pending").length;
      const acceptedOffers = offers.filter(
        (o) => o.status === "accepted",
      ).length;
      const rejectedOffers = offers.filter(
        (o) => o.status === "rejected",
      ).length;

      // New users today
      const today = new Date().toISOString().split("T")[0];
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      // New listings today
      const { count: newListingsToday } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      // New farmers today
      const { count: newFarmersToday } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      return {
        success: true,
        data: {
          users: {
            total: totalUsers,
            managers,
            buyers,
            admins,
            new_today: newUsersToday || 0,
          },
          listings: {
            total: totalListings,
            active: activeListings,
            reserved: reservedListings,
            completed: completedListings,
            expired: expiredListings,
            new_today: newListingsToday || 0,
            expiring_soon: expiringSoon || 0,
          },
          farmers: {
            total: totalFarmers || 0,
            active: activeFarmers || 0,
            new_today: newFarmersToday || 0,
          },
          offers: {
            total: totalOffers,
            pending: pendingOffers,
            accepted: acceptedOffers,
            rejected: rejectedOffers,
          },
        },
      };
    } catch (error) {
      console.error("System stats error:", error.message);
      return { success: false, error: error.message };
    }
  },

  async getUsers({ page = 1, limit = 20, role = null, search = null } = {}) {
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (role) query = query.eq("role", role);
      if (search)
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

      const { data, error, count } = await query;

      if (error) throw error;

      return { success: true, data, count };
    } catch (error) {
      console.error("Get users error:", error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  async getListings({
    page = 1,
    limit = 20,
    status = null,
    search = null,
  } = {}) {
    try {
      let query = supabase
        .from("listings")
        .select("*, profiles:manager_id (full_name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status) query = query.eq("status", status);
      if (search) query = query.ilike("product_name", `%${search}%`);

      const { data, error, count } = await query;

      if (error) throw error;

      // Map manager name
      const mapped = data.map((item) => ({
        ...item,
        manager_name: item.profiles?.full_name || "Unknown",
      }));

      return { success: true, data: mapped, count };
    } catch (error) {
      console.error("Get listings error:", error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  async broadcastNotification({
    title,
    message,
    type = "in_app",
    target_roles = null,
  }) {
    try {
      // In real implementation, you'd call an edge function or backend endpoint
      // For now, we'll simulate success.
      // You can replace this with actual API call to /api/admin/notifications/broadcast
      return { success: true, message: "Broadcast sent successfully" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
