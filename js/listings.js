
const listingSupabase = window.supabaseClient;

// ==========================================
// GET LISTINGS FROM SUPABASE
// ==========================================

async function getListings() {
    const { data, error } = await listingSupabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Unable to fetch listings:", error);
        throw error;
    }

    return data.map(function (item) {
        return {
            id: item.id,
            type: item.type,
            name: item.name,
            category: item.category,
            campus: item.campus,
            location: item.location,
            date: item.item_date,
            description: item.description,
            photos: item.photo_urls || [],
            contactEmail: item.contact_email,
            contactNumber: item.contact_number,
            ownerId: item.owner_id,
            status: item.status,
            createdAt: item.created_at
        };
    });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
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

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

// ==========================================
// IMAGE PROCESSING
// ==========================================

function compressImage(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onload = function (event) {
            const image = new Image();

            image.onload = function () {
                const canvas = document.createElement("canvas");
                const maxWidth = 900;
                const maxHeight = 900;

                let width = image.width;
                let height = image.height;

                if (width > maxWidth || height > maxHeight) {
                    const scale = Math.min(
                        maxWidth / width,
                        maxHeight / height
                    );

                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, width, height);

                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };

            image.onerror = function () {
                reject(new Error("Unable to process an image."));
            };

            image.src = event.target.result;
        };

        reader.onerror = function () {
            reject(new Error("Unable to read an image."));
        };

        reader.readAsDataURL(file);
    });
}

// ==========================================
// REPORT FORM
// ==========================================

const reportForm = document.getElementById("reportForm");

if (reportForm) {
    const photoInput = document.getElementById("itemPhotos");
    const photoPreview = document.getElementById("photoPreview");
    const reportMessage = document.getElementById("reportMessage");

    async function loadReportUser() {
    const { data, error } = await listingSupabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("contactEmail").value =
        data.user.email || "";

    return {
        user: data.user
    };
}

    // Check login before allowing reports.
    loadReportUser();

    // IMAGE PREVIEWS
    photoInput.addEventListener("change", function () {
        photoPreview.innerHTML = "";

        const files = Array.from(photoInput.files);

        if (files.length > 3) {
            alert("You can upload a maximum of 3 photos.");
            photoInput.value = "";
            return;
        }

        files.forEach(function (file) {
            if (!file.type.startsWith("image/")) {
                return;
            }

            const imageURL = URL.createObjectURL(file);
            const image = document.createElement("img");

            image.src = imageURL;
            image.alt = "Selected item photo";
            image.style.width = "100px";
            image.style.height = "100px";
            image.style.objectFit = "cover";
            image.style.borderRadius = "10px";

            photoPreview.appendChild(image);
        });
    });

    // SUBMIT REPORT
    reportForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const submitButton = reportForm.querySelector(
            'button[type="submit"]'
        );

        const files = Array.from(photoInput.files);

        reportMessage.hidden = false;
        reportMessage.textContent = "";

        if (files.length > 3) {
            reportMessage.textContent =
                "Please select no more than 3 photos.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Publishing...";

        try {
            // VERIFY AUTHENTICATED USER
            const { data: authData, error: authError } =
                await listingSupabase.auth.getUser();

            if (authError || !authData.user) {
                throw new Error("Please sign in before reporting an item.");
            }

            const user = authData.user;


            // PROCESS PHOTOS
            const photos = [];

            for (const file of files) {
                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    throw new Error(
                        "Please upload JPG, PNG, or WEBP images only."
                    );
                }

                if (file.size > 8 * 1024 * 1024) {
                    throw new Error(
                        "Each photo must be smaller than 8 MB."
                    );
                }

                const compressedPhoto = await compressImage(file);
                photos.push(compressedPhoto);
            }

            // PREPARE DATABASE RECORD
            const newListing = {
                owner_id: user.id,
                type: document.getElementById("reportType").value,
                name: document.getElementById("itemName").value.trim(),
                category: document.getElementById("itemCategory").value,
                campus: document.getElementById("itemCampus").value,
                location: document.getElementById("itemLocation").value.trim(),
                item_date: document.getElementById("itemDate").value,
                description: document.getElementById("itemDescription").value.trim(),
                photo_urls: photos,
                contact_email: document.getElementById("contactEmail").value.trim(),
                contact_number: document.getElementById("contactNumber").value.trim()
            };

            // INSERT INTO SUPABASE
            const { error: insertError } = await listingSupabase
                .from("listings")
                .insert(newListing);

            if (insertError) {
                throw insertError;
            }

            reportMessage.textContent =
                "Listing published successfully! Redirecting to the feed...";

            reportForm.reset();
            photoPreview.innerHTML = "";

            setTimeout(function () {
                window.location.href = "feed.html";
            }, 1200);

        } catch (error) {
            console.error("Listing submission error:", error);

            reportMessage.textContent =
                error.message || "Something went wrong while publishing.";

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Publish listing";
        }
    });
}

// ==========================================
// FEED DISPLAY AND FILTERING
// ==========================================

const listingGrid = document.getElementById("listingGrid");

if (listingGrid) {
    const searchInput = document.getElementById("feedSearch");
    const campusFilter = document.getElementById("campusFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const typeButtons = document.querySelectorAll(".chip[data-type]");
    const listingCount = document.getElementById("listingCount");
    const feedSubtitle = document.getElementById("feedSubtitle");

    let selectedType = "All";
    let allListings = [];

    // RENDER LISTINGS
    function renderListings() {
        const searchText = searchInput.value.trim().toLowerCase();
        const selectedCampus = campusFilter.value;
        const selectedCategory = categoryFilter.value;

        const filteredListings = allListings.filter(function (item) {
            const matchesSearch =
                item.name.toLowerCase().includes(searchText) ||
                item.description.toLowerCase().includes(searchText) ||
                item.location.toLowerCase().includes(searchText) ||
                item.campus.toLowerCase().includes(searchText);

            const matchesCampus =
                selectedCampus === "" || item.campus === selectedCampus;

            const matchesCategory =
                selectedCategory === "" || item.category === selectedCategory;

            const matchesType =
                selectedType === "All" || item.type === selectedType;

            return (
                matchesSearch &&
                matchesCampus &&
                matchesCategory &&
                matchesType
            );
        });

        listingGrid.innerHTML = "";

        listingCount.textContent =
            filteredListings.length +
            (filteredListings.length === 1 ? " item" : " items");

        feedSubtitle.textContent =
            "Showing " + filteredListings.length + " matching listings.";

        if (filteredListings.length === 0) {
            listingGrid.innerHTML = `
                <div class="empty-state"
                     style="grid-column:1/-1;text-align:center;padding:40px 20px">
                    <div style="font-size:40px;margin-bottom:12px">🔎</div>
                    <h3>No listings found</h3>
                    <p class="subtitle">
                        Try changing your search or filters.
                    </p>
                </div>
            `;

            return;
        }

        filteredListings.forEach(function (item) {
            const article = document.createElement("article");
            article.className = "item-card";

            const isLost = item.type === "Lost";

            const statusText = isLost
                ? "LOST ITEM"
                : "FOUND • " + (item.status || "Available").toUpperCase();

            const statusClass = isLost ? "lost" : "available";

            const imageContent =
                item.photos && item.photos.length > 0
                    ? `<img src="${item.photos[0]}"
                            alt="${escapeHTML(item.name)}"
                            style="width:100%;height:100%;object-fit:cover">`
                    : `<div class="item-placeholder">
                            ${isLost ? "🔎" : "📦"}
                       </div>`;

            article.innerHTML = `
                <a href="item-details.html?id=${encodeURIComponent(item.id)}"
                   class="item-image">
                    ${imageContent}
                    <span class="status ${statusClass}">
                        ${escapeHTML(statusText)}
                    </span>
                </a>

                <div class="card-body">
                    <h3>${escapeHTML(item.name)}</h3>

                    <div class="meta">
                        <span class="meta-icon">▦</span>
                        ${escapeHTML(formatDate(item.date))}
                    </div>

                    <div class="meta">
                        <span class="meta-icon">⌖</span>
                        ${escapeHTML(item.campus)}
                    </div>

                    <div class="card-bottom">
                        <small style="color:var(--muted)">
                            ${escapeHTML(item.category)}
                        </small>

                        <a class="btn btn-primary"
                           href="item-details.html?id=${encodeURIComponent(item.id)}">
                            View item&nbsp; ›
                        </a>
                    </div>
                </div>
            `;

            listingGrid.appendChild(article);
        });
    }

    // LOAD LISTINGS FROM DATABASE
    async function loadFeed() {
        listingGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px">
                Loading listings...
            </div>
        `;

        try {
            allListings = await getListings();
            renderListings();

        } catch (error) {
            console.error("Feed loading error:", error);

            listingGrid.innerHTML = `
                <div class="empty-state"
                     style="grid-column:1/-1;text-align:center;padding:40px 20px">
                    <h3>Unable to load listings</h3>
                    <p class="subtitle">
                        Please refresh the page or try again later.
                    </p>
                </div>
            `;
        }
    }

    // SEARCH
    searchInput.addEventListener("input", renderListings);

    // CAMPUS FILTER
    campusFilter.addEventListener("change", renderListings);

    // CATEGORY FILTER
    categoryFilter.addEventListener("change", renderListings);

    // LOST / FOUND FILTERS
    typeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            typeButtons.forEach(function (otherButton) {
                otherButton.classList.remove("active");
            });

            button.classList.add("active");
            selectedType = button.dataset.type;

            renderListings();
        });
    });

    loadFeed();
}
