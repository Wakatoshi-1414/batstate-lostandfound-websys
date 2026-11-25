
(() => {
  const db = window.supabaseClient;

  let currentUser = null;

  document.addEventListener("DOMContentLoaded", initializeNotifications);

  async function initializeNotifications() {
    const {
      data: { user },
      error
    } = await db.auth.getUser();

    if (error || !user) {
      window.location.href = "index.html";
      return;
    }

    currentUser = user;

    document.getElementById("markAllReadBtn")
      .addEventListener("click", markAllAsRead);

    await loadNotifications();
  }

  async function loadNotifications() {
    const container = document.getElementById("notificationsList");

    container.innerHTML = `<p class="subtitle">Loading notifications...</p>`;

    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notification loading error:", error);
      container.innerHTML = `
        <p class="subtitle">Unable to load notifications. Please try again.</p>
      `;
      return;
    }

    renderNotifications(data || []);
  }

  function renderNotifications(notifications) {
    const container = document.getElementById("notificationsList");

    if (!notifications.length) {
      container.innerHTML = `
        <div style="padding: 20px 0; text-align: center;">
          <h3>No notifications yet</h3>
          <p class="subtitle">
            You'll see updates about your listings and claims here.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications.map(notification => {
      const date = new Date(notification.created_at);

      const formattedDate = date.toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });

      const isRead = notification.is_read;

      return `
        <div style="
          padding: 15px 0;
          border-bottom: 1px solid var(--line);
          ${isRead ? "opacity: 0.65;" : ""}
        ">
          <span class="status ${isRead ? "available" : "claimed"}"
                style="position: static">
            ${isRead ? "Read" : "New"}
          </span>

          <h3 style="margin-top: 12px">
            ${escapeHTML(notification.title)}
          </h3>

          <p class="subtitle">
            ${escapeHTML(notification.message)}
          </p>

          <small class="helper">${escapeHTML(formattedDate)}</small>
        </div>
      `;
    }).join("");
  }

  async function markAllAsRead() {
    const button = document.getElementById("markAllReadBtn");

    button.disabled = true;
    button.textContent = "Updating...";

    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUser.id)
      .eq("is_read", false);

    if (error) {
      console.error("Mark as read error:", error);
      alert("Unable to update notifications. Please try again.");
    }

    await loadNotifications();

    button.disabled = false;
    button.textContent = "Mark all as read";
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
})();
