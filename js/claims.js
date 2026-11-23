
// ==========================================
// SHARED STORAGE FUNCTIONS
// ==========================================

function getListings() {
    try {
        return JSON.parse(localStorage.getItem("listings")) || [];
    } catch (error) {
        return [];
    }
}

function saveListings(listings) {
    localStorage.setItem("listings", JSON.stringify(listings));
}

function getClaims() {
    try {
        return JSON.parse(localStorage.getItem("claims")) || [];
    } catch (error) {
        return [];
    }
}

function saveClaims(claims) {
    localStorage.setItem("claims", JSON.stringify(claims));
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
        return null;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
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

function formatListingDate(value) {
    const date = new Date(value + "T00:00:00");

    if (isNaN(date.getTime())) {
        return value || "Unknown date";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

// Use the reporter's email to identify the listing owner.
// This also supports listings created before ownerEmail was added.
function getOwnerEmail(item) {
    return (item.ownerEmail || item.contactEmail || "").trim().toLowerCase();
}

// ==========================================
// ITEM DETAILS PAGE
// ==========================================

const claimForm = document.getElementById("claimForm");

if (claimForm) {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("id");

    const listings = getListings();
    const item = listings.find(function(listing) {
        return listing.id === listingId;
    });

    const claimSection = document.getElementById("claimSection");
    const ownerMessage = document.getElementById("ownerMessage");

    if (!item) {
        document.getElementById("detailName").textContent = "Item not found";
        document.getElementById("detailDescription").textContent =
            "This listing does not exist or may have been removed.";

        claimSection.hidden = true;
    } else {
        const currentUser = getCurrentUser();
        const currentEmail = currentUser && currentUser.email
            ? currentUser.email.trim().toLowerCase()
            : "";

        const ownerEmail = getOwnerEmail(item);
        const isOwner = currentEmail !== "" && currentEmail === ownerEmail;
        const isClaimed = item.status === "Claimed" || item.status === "Returned";

        document.title = item.name + " | BatStateU Lost & Found";

        document.getElementById("detailName").textContent = item.name;
        document.getElementById("detailId").textContent = "Listing ID: " + item.id;
        document.getElementById("detailHeading").textContent = item.name;
        document.getElementById("detailCategory").textContent = item.category;
        document.getElementById("detailDescription").textContent = item.description;
        document.getElementById("detailDate").textContent =
            "▦  Reported: " + formatListingDate(item.date);
        document.getElementById("detailCampus").textContent =
            "⌖  " + item.campus;
        document.getElementById("detailLocation").textContent =
            "⌖  " + item.location;
        document.getElementById("detailType").textContent =
            "▣  Type: " + item.type;
        document.getElementById("detailPoster").textContent =
            "Posted by: " + (item.postedBy || "Unknown user");

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
        } else {
            statusElement.textContent = "FOUND • AVAILABLE";
            statusElement.className = "status available";
        }

        // CONTACT REPORTER
        const contactLink = document.getElementById("contactReporter");

        if (item.contactEmail) {
            contactLink.href = "mailto:" + encodeURIComponent(item.contactEmail);
        } else {
            contactLink.hidden = true;
        }

        // DISPLAY PHOTOS
        const mainPhoto = document.getElementById("mainPhoto");
        const thumbnailRow = document.getElementById("thumbnailRow");

        if (item.photos && item.photos.length > 0) {
            mainPhoto.innerHTML = "";

            const mainImage = document.createElement("img");
            mainImage.src = item.photos[0];
            mainImage.alt = item.name;
            mainImage.style.width = "100%";
            mainImage.style.height = "100%";
            mainImage.style.objectFit = "contain";

            mainPhoto.appendChild(mainImage);

            item.photos.forEach(function(photo, index) {
                const thumbnail = document.createElement("img");

                thumbnail.src = photo;
                thumbnail.alt = "Item photo " + (index + 1);
                thumbnail.className = "thumb";
                thumbnail.style.objectFit = "cover";
                thumbnail.style.cursor = "pointer";

                thumbnail.addEventListener("click", function() {
                    mainImage.src = photo;
                });

                thumbnailRow.appendChild(thumbnail);
            });
        }

        // CLAIM FORM VISIBILITY
        if (item.type !== "Found") {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "Only found items can receive claim requests.";
        } else if (isClaimed) {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "This item has already been claimed or returned.";
        } else if (isOwner) {
            claimSection.hidden = true;
            ownerMessage.hidden = false;
            ownerMessage.textContent =
                "This is your listing. You can review incoming claim requests in My Listings.";
        } else {
            // PREFILL CLAIMANT INFORMATION
            if (currentUser) {
                document.getElementById("claimName").value =
                    currentUser.firstName + " " + currentUser.lastName;

                document.getElementById("claimEmail").value =
                    currentUser.email;
            }

            // CHECK FOR EXISTING CLAIM
            const existingClaim = getClaims().find(function(claim) {
                return claim.listingId === item.id &&
                    claim.claimantEmail.toLowerCase() ===
                    document.getElementById("claimEmail").value.trim().toLowerCase() &&
                    claim.status === "Pending";
            });

            if (existingClaim) {
                document.getElementById("claimMessage").hidden = false;
                document.getElementById("claimMessage").textContent =
                    "You already have a pending claim for this item.";
                claimForm.querySelector("button[type='submit']").disabled = true;
            }
        }

        // SUBMIT CLAIM
        claimForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const message = document.getElementById("claimMessage");

            const claimantName =
                document.getElementById("claimName").value.trim();

            const claimantEmail =
                document.getElementById("claimEmail").value.trim().toLowerCase();

            const reason =
                document.getElementById("claimReason").value.trim();

            message.hidden = false;

            if (!claimantName || !claimantEmail || !reason) {
                message.textContent = "Please complete all required fields.";
                return;
            }

            if (!claimantEmail.includes("@")) {
                message.textContent = "Please enter a valid email address.";
                return;
            }

            const latestListings = getListings();
            const latestItem = latestListings.find(function(listing) {
                return listing.id === item.id;
            });

            if (!latestItem || latestItem.type !== "Found" ||
                latestItem.status === "Claimed" ||
                latestItem.status === "Returned") {
                message.textContent = "This item is no longer available for claiming.";
                return;
            }

            if (claimantEmail === getOwnerEmail(latestItem)) {
                message.textContent = "You cannot claim your own listing.";
                return;
            }

            const claims = getClaims();

            const duplicateClaim = claims.find(function(claim) {
                return claim.listingId === item.id &&
                    claim.claimantEmail.toLowerCase() === claimantEmail &&
                    (claim.status === "Pending" || claim.status === "Approved");
            });

            if (duplicateClaim) {
                message.textContent =
                    "You already submitted a claim for this item.";
                return;
            }

            const newClaim = {
                id: "claim-" + Date.now(),
                listingId: item.id,
                itemName: item.name,
                ownerEmail: getOwnerEmail(latestItem),
                claimantName: claimantName,
                claimantEmail: claimantEmail,
                reason: reason,
                status: "Pending",
                createdAt: new Date().toISOString()
            };

            claims.push(newClaim);
            saveClaims(claims);

            message.textContent =
                "Your claim request has been submitted successfully!";

            claimForm.reset();

            const user = getCurrentUser();

            if (user) {
                document.getElementById("claimName").value =
                    user.firstName + " " + user.lastName;

                document.getElementById("claimEmail").value = user.email;
            }

            claimForm.querySelector("button[type='submit']").disabled = true;
        });
    }
}

// ==========================================
// MY LISTINGS PAGE
// ==========================================

const myListingsBody = document.getElementById("myListingsBody");

if (myListingsBody) {
    const currentUser = getCurrentUser();

    const userEmail = currentUser && currentUser.email
        ? currentUser.email.trim().toLowerCase()
        : "";

    const filterButtons = document.querySelectorAll("[data-filter]");
    const claimRequestsList = document.getElementById("claimRequestsList");

    let selectedFilter = "All";

    function getMyListings() {
        return getListings().filter(function(item) {
            return getOwnerEmail(item) === userEmail;
        });
    }

    function renderMyListings() {
        const myListings = getMyListings();

        const filteredListings = myListings.filter(function(item) {
            if (selectedFilter === "All") {
                return true;
            }

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

        filteredListings.forEach(function(item) {
            const row = document.createElement("tr");

            let statusText = "Available";
            let statusClass = "available";

            if (item.status === "Claimed") {
                statusText = "Claimed";
                statusClass = "claimed";
            } else if (item.status === "Returned") {
                statusText = "Returned";
                statusClass = "returned";
            } else if (item.type === "Lost") {
                statusText = "Lost";
                statusClass = "lost";
            }

            row.innerHTML = `
                <td>${escapeHTML(item.name)}</td>
                <td>${escapeHTML(item.type)}</td>
                <td>${escapeHTML(item.campus)}</td>
                <td>${escapeHTML(formatListingDate(item.date))}</td>
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

    function renderClaimRequests() {
        const myListings = getMyListings();
        const myListingIds = myListings.map(function(item) {
            return item.id;
        });

        const claims = getClaims().filter(function(claim) {
            return myListingIds.includes(claim.listingId);
        });

        claimRequestsList.innerHTML = "";

        if (claims.length === 0) {
            claimRequestsList.innerHTML = `
                <div class="panel" style="grid-column:1/-1;text-align:center">
                    <h3>No claim requests yet</h3>
                    <p class="subtitle">Incoming requests for your items will appear here.</p>
                </div>
            `;
            return;
        }

        claims.slice().reverse().forEach(function(claim) {
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
                <h3 style="margin:8px 0">${escapeHTML(claim.itemName)}</h3>

                <p class="subtitle">
                    <strong>Claimant:</strong> ${escapeHTML(claim.claimantName)}
                </p>

                <p class="subtitle">
                    <strong>Email:</strong> ${escapeHTML(claim.claimantEmail)}
                </p>

                <p style="margin-top:12px">
                    <strong>Explanation:</strong><br>
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
        document.querySelectorAll(".approve-claim").forEach(function(button) {
            button.addEventListener("click", function() {
                const confirmed = confirm(
                    "Are you sure you want to approve this claim? Other pending claims for this item will be rejected."
                );

                if (!confirmed) {
                    return;
                }

                const claims = getClaims();
                const selectedClaim = claims.find(function(claim) {
                    return claim.id === button.dataset.id;
                });

                if (!selectedClaim || selectedClaim.status !== "Pending") {
                    alert("This claim is no longer pending.");
                    return;
                }

                const listings = getListings();
                const selectedItem = listings.find(function(item) {
                    return item.id === selectedClaim.listingId;
                });

                if (!selectedItem || selectedItem.status === "Claimed" ||
                    selectedItem.status === "Returned") {
                    alert("This item is no longer available.");
                    return;
                }

                if (getOwnerEmail(selectedItem) !== userEmail) {
                    alert("You are not the owner of this listing.");
                    return;
                }

                selectedClaim.status = "Approved";
                selectedClaim.reviewedAt = new Date().toISOString();

                // Reject other pending claims for this item
                claims.forEach(function(claim) {
                    if (claim.listingId === selectedItem.id &&
                        claim.id !== selectedClaim.id &&
                        claim.status === "Pending") {
                        claim.status = "Rejected";
                        claim.reviewedAt = new Date().toISOString();
                    }
                });

                selectedItem.status = "Claimed";

                saveClaims(claims);
                saveListings(listings);

                alert("Claim approved successfully!");
                renderMyListings();
                renderClaimRequests();
            });
        });

        // REJECT CLAIM
        document.querySelectorAll(".reject-claim").forEach(function(button) {
            button.addEventListener("click", function() {
                const confirmed = confirm("Are you sure you want to reject this claim?");

                if (!confirmed) {
                    return;
                }

                const claims = getClaims();

                const selectedClaim = claims.find(function(claim) {
                    return claim.id === button.dataset.id;
                });

                if (!selectedClaim || selectedClaim.status !== "Pending") {
                    alert("This claim is no longer pending.");
                    return;
                }

                if (selectedClaim.ownerEmail !== userEmail) {
                    alert("You are not authorized to review this claim.");
                    return;
                }

                selectedClaim.status = "Rejected";
                selectedClaim.reviewedAt = new Date().toISOString();

                saveClaims(claims);

                alert("Claim rejected.");
                renderClaimRequests();
            });
        });
    }

    // ==========================================
    // FILTER BUTTONS
    // ==========================================

    filterButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            filterButtons.forEach(function(otherButton) {
                otherButton.classList.remove("active");
            });

            button.classList.add("active");
            selectedFilter = button.dataset.filter;

            renderMyListings();
        });
    });

    if (!userEmail) {
        myListingsBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:25px">
                    No logged-in user found. Log in to see your listings.
                </td>
            </tr>
        `;

        claimRequestsList.innerHTML = `
            <div class="panel">
                <p class="subtitle">Log in to review your claim requests.</p>
            </div>
        `;
    } else {
        renderMyListings();
        renderClaimRequests();
    }
}
