
(() => {
    const db = window.supabaseClient;

    // ==========================================
    // SHARED FUNCTIONS
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const characters = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return characters[character];
        });
    }

    function formatDate(value) {
        if (!value) return "Unknown date";

        const date = new Date(value + "T00:00:00");

        if (isNaN(date.getTime())) return value;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    async function getCurrentUser() {
        const { data, error } = await db.auth.getUser();

        if (error) {
            console.error("User error:", error);
            return null;
        }

        return data.user;
    }

    async function getUserProfile(userId) {
        const { data, error } = await db
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("Profile error:", error);
            return null;
        }

        return data;
    }

    function showMessage(element, message) {
        if (!element) return;

        element.hidden = false;
        element.textContent = message;
    }

    function getFullName(profile) {
        if (!profile) return "";

        return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    }

    // ==========================================
    // ITEM DETAILS PAGE
    // ==========================================

    async function initItemDetails() {
        const claimForm = document.getElementById("claimForm");

        if (!claimForm) return;

        const params = new URLSearchParams(window.location.search);
        const listingId = params.get("id");

        const claimSection = document.getElementById("claimSection");
        const ownerMessage = document.getElementById("ownerMessage");
        const claimMessage = document.getElementById("claimMessage");

        if (!listingId) {
            document.getElementById("detailName").textContent = "Item not found";
            document.getElementById("detailDescription").textContent =
                "No listing ID was provided.";

            claimSection.hidden = true;
            return;
        }

        // GET LISTING FROM SUPABASE
        const { data: item, error } = await db
            .from("listings")
            .select("*")
            .eq("id", listingId)
            .maybeSingle();

        if (error) {
            console.error("Listing retrieval error:", error);

            document.getElementById("detailName").textContent =
                "Unable to load item";

            document.getElementById("detailDescription").textContent =
                error.message;

            claimSection.hidden = true;
            return;
        }

        if (!item) {
            document.getElementById("detailName").textContent = "Item not found";
            document.getElementById("detailDescription").textContent =
                "This listing does not exist or may have been removed.";

            claimSection.hidden = true;
            return;
        }

        // GET CURRENT USER
        const currentUser = await getCurrentUser();

        let profile = null;

        if (currentUser) {
            profile = await getUserProfile(currentUser.id);
        }

        const isOwner = currentUser && currentUser.id === item.owner_id;

        const isClaimed =
            item.status === "Claimed" ||
            item.status === "Returned" ||
            item.status === "Closed";

        // ==========================================
        // DISPLAY ITEM INFORMATION
        // ==========================================

        document.title = item.name + " | BatStateU Lost & Found";

        document.getElementById("detailName").textContent = item.name;
        document.getElementById("detailId").textContent =
            "Listing ID: " + item.id;

        document.getElementById("detailHeading").textContent = item.name;
        document.getElementById("detailCategory").textContent = item.category;
        document.getElementById("detailDescription").textContent =
            item.description;

        document.getElementById("detailDate").textContent =
            "▦  Reported: " + formatDate(item.item_date);

        document.getElementById("detailCampus").textContent =
            "⌖  " + item.campus;

        document.getElementById("detailLocation").textContent =
            "⌖  " + item.location;

        document.getElementById("detailType").textContent =
            "▣  Type: " + item.type;

        document.getElementById("detailPoster").textContent =
            "Posted by: " + (isOwner ? "You" : "Student");

        // ==========================================
        // ITEM STATUS
        // ==========================================

        const statusElement = document.getElementById("detailStatus");

        if (item.status === "Returned") {
            statusElement.textContent = "RETURNED";
            statusElement.className = "status returned";
        } else if (item.status === "Claimed") {
            statusElement.textContent = "CLAIMED";
            statusElement.className = "status claimed";
        } else if (item.type === "Lost") {
            statusElement.textContent = "LOST ITEM";
            statusElement.className = "status lost";
        } else if (item.status === "Closed") {
            statusElement.textContent = "CLOSED";
            statusElement.className = "status";
        } else {
            statusElement.textContent = "FOUND • AVAILABLE";
            statusElement.className = "status available";
        }

        // ==========================================
        // CONTACT REPORTER
        // ==========================================

        const contactLink = document.getElementById("contactReporter");

        if (item.contact_email) {
            contactLink.href =
                "mailto:" + encodeURIComponent(item.contact_email);
        } else {
            contactLink.hidden = true;
        }

        // ==========================================
        // DISPLAY PHOTOS
        // ==========================================

        const mainPhoto = document.getElementById("mainPhoto");
        const thumbnailRow = document.getElementById("thumbnailRow");

        const photos = item.photo_urls || [];

        if (photos.length > 0) {
            mainPhoto.innerHTML = "";

            const mainImage = document.createElement("img");

            mainImage.src = photos[0];
            mainImage.alt = item.name;
            mainImage.style.width = "100%";
            mainImage.style.height = "100%";
            mainImage.style.objectFit = "contain";

            mainPhoto.appendChild(mainImage);

            thumbnailRow.innerHTML = "";

            photos.forEach((photo, index) => {
                const thumbnail = document.createElement("img");

                thumbnail.src = photo;
                thumbnail.alt = "Item photo " + (index + 1);
                thumbnail.className = "thumb";
                thumbnail.style.objectFit = "cover";
                thumbnail.style.cursor = "pointer";

                thumbnail.addEventListener("click", () => {
                    mainImage.src = photo;
                });

                thumbnailRow.appendChild(thumbnail);
            });
        }

        // ==========================================
        // CLAIM FORM VISIBILITY
        // ==========================================

        if (item.type !== "Found") {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "Only found items can receive claim requests.";

        } else if (isClaimed) {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "This item is no longer available for claiming.";

        } else if (isOwner) {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "This is your listing. You can review incoming claim requests in My Listings.";

        } else if (!currentUser) {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "Please log in to submit a claim request.";

        } else {
            // PREFILL CLAIMANT INFORMATION

            const claimName = document.getElementById("claimName");
            const claimEmail = document.getElementById("claimEmail");

            claimName.value = getFullName(profile);
            claimEmail.value = currentUser.email || "";

            // CHECK EXISTING CLAIM

            const { data: existingClaims, error: existingError } = await db
                .from("claims")
                .select("id, status")
                .eq("listing_id", item.id)
                .eq("claimant_id", currentUser.id)
                .in("status", ["Pending", "Approved"]);

            if (existingError) {
                console.error("Existing claim check error:", existingError);
            }

            if (existingClaims && existingClaims.length > 0) {
                showMessage(
                    claimMessage,
                    "You already submitted a claim for this item."
                );

                claimForm.querySelector("button[type='submit']").disabled = true;
            }
        }

        // ==========================================
        // SUBMIT CLAIM
        // ==========================================

        claimForm.addEventListener("submit", async event => {
            event.preventDefault();

            const message = document.getElementById("claimMessage");
            const submitButton =
                claimForm.querySelector("button[type='submit']");

            const user = await getCurrentUser();

            if (!user) {
                showMessage(message, "Please log in before submitting a claim.");
                return;
            }

            const claimantName =
                document.getElementById("claimName").value.trim();

            const claimantEmail =
                document.getElementById("claimEmail").value.trim();

            const reason =
                document.getElementById("claimReason").value.trim();

            if (!claimantName || !claimantEmail || !reason) {
                showMessage(message, "Please complete all required fields.");
                return;
            }

            if (!claimantEmail.includes("@")) {
                showMessage(message, "Please enter a valid email address.");
                return;
            }

            if (user.id === item.owner_id) {
                showMessage(message, "You cannot claim your own listing.");
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            // CHECK CURRENT LISTING STATUS AGAIN

            const { data: latestItem, error: listingError } = await db
                .from("listings")
                .select("id, type, status, owner_id")
                .eq("id", item.id)
                .maybeSingle();

            if (listingError || !latestItem) {
                showMessage(message, "Unable to verify this listing.");
                submitButton.disabled = false;
                submitButton.textContent = "Submit Claim";
                return;
            }

            if (
                latestItem.type !== "Found" ||
                latestItem.status !== "Available"
            ) {
                showMessage(
                    message,
                    "This item is no longer available for claiming."
                );

                submitButton.disabled = false;
                submitButton.textContent = "Submit Claim";
                return;
            }

            // INSERT CLAIM INTO SUPABASE

            const { error: claimError } = await db
                .from("claims")
                .insert({
                    listing_id: item.id,
                    claimant_id: user.id,
                    claimant_name: claimantName,
                    claimant_email: claimantEmail,
                    reason: reason,
                    status: "Pending"
                });

            if (claimError) {
                console.error("Claim submission error:", claimError);

                if (claimError.code === "23505") {
                    showMessage(
                        message,
                        "You already have an active claim for this item."
                    );
                } else {
                    showMessage(
                        message,
                        "Unable to submit claim: " + claimError.message
                    );
                }

                submitButton.disabled = false;
                submitButton.textContent = "Submit Claim";
                return;
            }

            showMessage(
                message,
                "Your claim request has been submitted successfully!"
            );

            claimForm.reset();

            const profile = await getUserProfile(user.id);

            document.getElementById("claimName").value =
                getFullName(profile);

            document.getElementById("claimEmail").value =
                user.email || "";

            submitButton.disabled = true;
            submitButton.textContent = "Claim Submitted";
        });
    }

    // ==========================================
    // MY LISTINGS PAGE
    // ==========================================

    async function initMyListings() {
        const myListingsBody = document.getElementById("myListingsBody");

        if (!myListingsBody) return;

        const claimRequestsList =
            document.getElementById("claimRequestsList");

        const filterButtons = document.querySelectorAll("[data-filter]");

        let selectedFilter = "All";
        let currentUser = await getCurrentUser();

        if (!currentUser) {
            myListingsBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:25px">
                        Please log in to see your listings.
                    </td>
                </tr>
            `;

            if (claimRequestsList) {
                claimRequestsList.innerHTML = `
                    <div class="panel">
                        <p class="subtitle">
                            Log in to review your claim requests.
                        </p>
                    </div>
                `;
            }

            return;
        }

        // GET MY LISTINGS

        async function getMyListings() {
            const { data, error } = await db
                .from("listings")
                .select("*")
                .eq("owner_id", currentUser.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("My listings error:", error);
                return [];
            }

            return data || [];
        }

        // RENDER MY LISTINGS

        async function renderMyListings() {
            const listings = await getMyListings();

            const filteredListings = listings.filter(item => {
                if (selectedFilter === "All") return true;

                if (selectedFilter === "Claimed") {
                    return item.status === "Claimed";
                }

                if (selectedFilter === "Returned") {
                    return item.status === "Returned";
                }

                return item.type === selectedFilter;
            });

            myListingsBody.innerHTML = "";

            if (filteredListings.length === 0) {
                myListingsBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center;padding:25px">
                            No listings found.
                        </td>
                    </tr>
                `;

                return;
            }

            filteredListings.forEach(item => {
                const row = document.createElement("tr");

                let statusText = item.status || "Available";
                let statusClass = "available";

                if (item.status === "Claimed") {
                    statusClass = "claimed";
                } else if (item.status === "Returned") {
                    statusClass = "returned";
                } else if (item.type === "Lost") {
                    statusText = "Lost";
                    statusClass = "lost";
                }

                row.innerHTML = `
                    <td>${escapeHTML(item.name)}</td>
                    <td>${escapeHTML(item.type)}</td>
                    <td>${escapeHTML(item.campus)}</td>
                    <td>${escapeHTML(formatDate(item.item_date))}</td>
                    <td>
                        <span class="status ${statusClass}" style="position:static">
                            ${escapeHTML(statusText)}
                        </span>
                    </td>
                    <td>
                        <a class="back-link"
                           href="item-details.html?id=${encodeURIComponent(item.id)}">
                            View
                        </a>
                    </td>
                `;

                myListingsBody.appendChild(row);
            });
        }

        // ==========================================
        // DISPLAY INCOMING CLAIM REQUESTS
        // ==========================================

        async function renderClaimRequests() {
            if (!claimRequestsList) return;

            const listings = await getMyListings();

            const listingIds = listings.map(item => item.id);

            claimRequestsList.innerHTML = "";

            if (listingIds.length === 0) {
                claimRequestsList.innerHTML = `
                    <div class="panel" style="grid-column:1/-1;text-align:center">
                        <h3>No claim requests yet</h3>
                        <p class="subtitle">
                            Incoming requests for your items will appear here.
                        </p>
                    </div>
                `;

                return;
            }

            const { data: claims, error } = await db
                .from("claims")
                .select("*")
                .in("listing_id", listingIds)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Claim requests error:", error);

                claimRequestsList.textContent =
                    "Unable to load claim requests: " + error.message;

                return;
            }

            if (!claims || claims.length === 0) {
                claimRequestsList.innerHTML = `
                    <div class="panel" style="grid-column:1/-1;text-align:center">
                        <h3>No claim requests yet</h3>
                        <p class="subtitle">
                            Incoming requests for your items will appear here.
                        </p>
                    </div>
                `;

                return;
            }

            const listingMap = new Map(
                listings.map(item => [item.id, item])
            );

            claims.forEach(claim => {
                const item = listingMap.get(claim.listing_id);

                const card = document.createElement("div");
                card.className = "panel";

                let statusColor = "var(--amber)";

                if (claim.status === "Approved") {
                    statusColor = "var(--green)";
                } else if (claim.status === "Rejected") {
                    statusColor = "var(--red)";
                }

                let actionButtons = "";

                if (claim.status === "Pending") {
                    actionButtons = `
                        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
                            <button class="btn btn-primary approve-claim"
                                    data-id="${escapeHTML(claim.id)}">
                                Approve
                            </button>

                            <button class="btn btn-outline reject-claim"
                                    data-id="${escapeHTML(claim.id)}">
                                Reject
                            </button>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="eyebrow">Claim request</div>

                    <h3 style="margin:8px 0">
                        ${escapeHTML(item ? item.name : "Unknown item")}
                    </h3>

                    <p class="subtitle">
                        <strong>Claimant:</strong>
                        ${escapeHTML(claim.claimant_name)}
                    </p>

                    <p class="subtitle">
                        <strong>Email:</strong>
                        ${escapeHTML(claim.claimant_email)}
                    </p>

                    <p style="margin-top:12px">
                        <strong>Explanation:</strong>
                        ${escapeHTML(claim.reason)}
                    </p>

                    <p style="margin-top:14px">
                        <strong>Status:</strong>
                        <span style="color:${statusColor};font-weight:700">
                            ${escapeHTML(claim.status)}
                        </span>
                    </p>

                    ${actionButtons}
                `;

                claimRequestsList.appendChild(card);
            });

            // APPROVE CLAIM

            claimRequestsList.querySelectorAll(".approve-claim").forEach(button => {
                button.addEventListener("click", async () => {
                    const confirmed = confirm(
                        "Are you sure you want to approve this claim? Other pending claims for this item will be rejected."
                    );

                    if (!confirmed) return;

                    button.disabled = true;

                    const { error } = await db.rpc("review_claim", {
                        p_claim_id: button.dataset.id,
                        p_decision: "Approved"
                    });

                    if (error) {
                        console.error("Approve claim error:", error);
                        alert("Unable to approve claim: " + error.message);
                        button.disabled = false;
                        return;
                    }

                    alert("Claim approved successfully!");

                    await renderMyListings();
                    await renderClaimRequests();
                });
            });

            // REJECT CLAIM

            claimRequestsList.querySelectorAll(".reject-claim").forEach(button => {
                button.addEventListener("click", async () => {
                    const confirmed = confirm(
                        "Are you sure you want to reject this claim?"
                    );

                    if (!confirmed) return;

                    button.disabled = true;

                    const { error } = await db.rpc("review_claim", {
                        p_claim_id: button.dataset.id,
                        p_decision: "Rejected"
                    });

                    if (error) {
                        console.error("Reject claim error:", error);
                        alert("Unable to reject claim: " + error.message);
                        button.disabled = false;
                        return;
                    }

                    alert("Claim rejected.");

                    await renderClaimRequests();
                });
            });
        }

        // ==========================================
        // FILTER BUTTONS
        // ==========================================

        filterButtons.forEach(button => {
            button.addEventListener("click", async () => {
                filterButtons.forEach(otherButton => {
                    otherButton.classList.remove("active");
                });

                button.classList.add("active");
                selectedFilter = button.dataset.filter;

                await renderMyListings();
            });
        });

        // INITIAL LOAD

        await renderMyListings();
        await renderClaimRequests();
    }

    // ==========================================
    // INITIALIZE PAGES
    // ==========================================

    document.addEventListener("DOMContentLoaded", async () => {
        if (!db) {
            console.error("Supabase client was not initialized.");
            return;
        }

        await initItemDetails();
        await initMyListings();
    });
})();
