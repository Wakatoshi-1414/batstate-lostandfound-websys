
(() => {
  const db = window.supabaseClient;

  document.addEventListener("DOMContentLoaded", loadDashboard);

  async function loadDashboard() {
    const {
      data: { user },
      error: authError
    } = await db.auth.getUser();

    if (authError || !user) {
      window.location.href = "index.html";
      return;
    }

    const [
      profileResult,
      listingsResult,
      claimsResult,
      notificationsResult
    ] = await Promise.all([
      db.from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle(),

      db.from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),

      db.from("claims")
        .select("id, status")
        .eq("claimant_id", user.id),

      db.from("notifications")
        .select("is_read")
        .eq("user_id", user.id)
    ]);

    if (profileResult.error) {
      console.error("Profile error:", profileResult.error);
    }

    if (listingsResult.error) {
      console.error("Listings error:", listingsResult.error);
    }

    if (claimsResult.error) {
      console.error("Claims error:", claimsResult.error);
    }

    if (notificationsResult.error) {
      console.error("Notifications error:", notificationsResult.error);
    }

    const profile = profileResult.data;
    const listings = listingsResult.data || [];
    const claims = claimsResult.data || [];
    const notifications = notificationsResult.data || [];

    // DISPLAY USER NAME
    if (profile) {
      const fullName = `${profile.first_name} ${profile.last_name}`.trim();

      document.getElementById("welcomeName").textContent =
        fullName ? `Welcome back, ${fullName}!` : "Welcome back!";

      document.getElementById("userAvatar").textContent =
        fullName ? fullName.charAt(0).toUpperCase() : "S";
    }

    // CALCULATE STATISTICS
    const activeListings = listings.filter(listing =>
      ["Available", "Claimed"].includes(listing.status)
    );

    const returnedItems = listings.filter(
      listing => listing.status === "Returned"
    );

    const pendingClaims = claims.filter(
      claim => claim.status === "Pending"
    );

    const unreadNotifications = notifications.filter(
      notification => !notification.is_read
    );

    document.getElementById("activeListingsCount").textContent =
      activeListings.length;

    document.getElementById("unreadNotificationsCount").textContent =
      unreadNotifications.length;

    document.getElementById("pendingClaimsCount").textContent =
      pendingClaims.length;

    document.getElementById("returnedItemsCount").textContent =
      returnedItems.length;

    // DISPLAY RECENT LISTINGS
    renderRecentListings(listings.slice(0, 5));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function renderRecentListings(listings) {
    const container = document.getElementById("recentListings");

    if (!listings.length) {
      container.innerHTML = `
        <tr>
          <td colspan="3">You haven't reported any items yet.</td>
        </tr>
      `;
      return;
    }

    container.innerHTML = listings.map(listing => {
      const status = listing.status || "Available";
      const statusClass = status.toLowerCase();

      return `
        <tr>
          <td>
            <a href="item-details.html?id=${encodeURIComponent(listing.id)}">
              ${escapeHTML(listing.name)}
            </a>
          </td>
          <td>${escapeHTML(listing.campus)}</td>
          <td>
            <span class="status ${escapeHTML(statusClass)}" style="position: static">
              ${escapeHTML(status)}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }
})();
