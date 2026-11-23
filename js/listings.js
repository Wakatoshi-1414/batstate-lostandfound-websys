// ==========================================
// LOST & FOUND LISTINGS
// ==========================================

// GET LISTINGS FROM LOCAL STORAGE
function getListings() {
  try {
    return JSON.parse(localStorage.getItem("listings")) || [];
  } catch (error) {
    return [];
  }
}

// SAVE LISTINGS TO LOCAL STORAGE
function saveListings(listings) {
  localStorage.setItem("listings", JSON.stringify(listings));
}

// ==========================================
// SAMPLE LISTINGS
// ==========================================

function loadSampleListings() {
  if (localStorage.getItem("listings") !== null) {
    return;
  }

  const samples = [
    {
      id: "sample-1",
      type: "Lost",
      name: "Student ID",
      category: "Documents / IDs",
      campus: "Pablo Borbon Campus",
      location: "Unknown",
      date: "2026-11-10",
      description: "A student identification card was reported missing.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-10T09:00:00",
    },
    {
      id: "sample-2",
      type: "Found",
      name: "USB-C Charger",
      category: "Electronics",
      campus: "Alangilan Campus",
      location: "Near the library",
      date: "2026-11-11",
      description: "A USB-C charger was found and is available for claiming.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-11T09:00:00",
    },
    {
      id: "sample-3",
      type: "Found",
      name: "Brown Leather Wallet",
      category: "Personal Belongings",
      campus: "Lemery Campus",
      location: "Near the school entrance",
      date: "2026-11-09",
      description: "A brown leather wallet was found.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-09T09:00:00",
    },
    {
      id: "sample-4",
      type: "Lost",
      name: "Black Smartphone",
      category: "Electronics",
      campus: "JPLPC Malvar Campus",
      location: "Campus grounds",
      date: "2026-11-08",
      description: "A black smartphone was reported missing.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-08T09:00:00",
    },
    {
      id: "sample-5",
      type: "Found",
      name: "Navy Backpack",
      category: "Bags",
      campus: "ARASOF Nasugbu Campus",
      location: "Near the classroom building",
      date: "2026-11-07",
      description: "A navy backpack was found.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-07T09:00:00",
    },
    {
      id: "sample-6",
      type: "Lost",
      name: "Eyeglasses",
      category: "Personal Belongings",
      campus: "Balayan Campus",
      location: "School grounds",
      date: "2026-11-06",
      description: "A pair of eyeglasses was reported missing.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-06T09:00:00",
    },
    {
      id: "sample-7",
      type: "Found",
      name: "Wireless Earbuds",
      category: "Electronics",
      campus: "San Juan Campus",
      location: "Near the canteen",
      date: "2026-11-05",
      description: "Wireless earbuds were found.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-05T09:00:00",
    },
    {
      id: "sample-8",
      type: "Found",
      name: "Black Water Bottle",
      category: "Others",
      campus: "Lipa Campus",
      location: "Near the library",
      date: "2026-11-04",
      description: "A black water bottle was found.",
      photos: [],
      contactEmail: "sample@example.com",
      contactNumber: "",
      postedBy: "Sample User",
      createdAt: "2026-11-04T09:00:00",
    },
  ];

  saveListings(samples);
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
      "'": "&#039;",
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
    year: "numeric",
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
          const scale = Math.min(maxWidth / width, maxHeight / height);

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
  loadSampleListings();

  const photoInput = document.getElementById("itemPhotos");
  const photoPreview = document.getElementById("photoPreview");
  const reportMessage = document.getElementById("reportMessage");

  // AUTO-FILL EMAIL IF A USER IS LOGGED IN
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (currentUser && currentUser.email) {
      document.getElementById("contactEmail").value = currentUser.email;
    }
  } catch (error) {
    console.log("No saved user information.");
  }

  // SHOW IMAGE PREVIEWS
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

    const submitButton = reportForm.querySelector('button[type="submit"]');

    const files = Array.from(photoInput.files);

    reportMessage.hidden = false;
    reportMessage.textContent = "";

    if (files.length > 3) {
      reportMessage.textContent = "Please select no more than 3 photos.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Publishing...";

    try {
      const photos = [];

      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Please upload JPG, PNG, or WEBP images only.");
        }

        if (file.size > 8 * 1024 * 1024) {
          throw new Error("Each photo must be smaller than 8 MB.");
        }

        const compressedPhoto = await compressImage(file);
        photos.push(compressedPhoto);
      }

      let currentUser = null;

      try {
        currentUser = JSON.parse(localStorage.getItem("currentUser"));
      } catch (error) {
        currentUser = null;
      }

      const newListing = {
        id: "listing-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
        type: document.getElementById("reportType").value,
        name: document.getElementById("itemName").value.trim(),
        category: document.getElementById("itemCategory").value,
        campus: document.getElementById("itemCampus").value,
        location: document.getElementById("itemLocation").value.trim(),
        date: document.getElementById("itemDate").value,
        description: document.getElementById("itemDescription").value.trim(),
        photos: photos,
        contactEmail: document.getElementById("contactEmail").value.trim(),
        contactNumber: document.getElementById("contactNumber").value.trim(),
        postedBy: currentUser
          ? currentUser.firstName + " " + currentUser.lastName
          : "Guest",

        ownerEmail: currentUser
          ? currentUser.email.toLowerCase()
          : document.getElementById("contactEmail").value.trim().toLowerCase(),

        createdAt: new Date().toISOString(),
      };

      const listings = getListings();
      listings.unshift(newListing);

      saveListings(listings);

      reportMessage.textContent =
        "Listing published successfully! Redirecting to the feed...";

      reportForm.reset();
      photoPreview.innerHTML = "";

      setTimeout(function () {
        window.location.href = "feed.html";
      }, 1200);
    } catch (error) {
      reportMessage.textContent =
        error.message || "Something went wrong while publishing your listing.";

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
  loadSampleListings();

  const searchInput = document.getElementById("feedSearch");
  const campusFilter = document.getElementById("campusFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const typeButtons = document.querySelectorAll(".chip[data-type]");
  const listingCount = document.getElementById("listingCount");
  const feedSubtitle = document.getElementById("feedSubtitle");

  let selectedType = "All";

  function renderListings() {
    const listings = getListings();

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCampus = campusFilter.value;
    const selectedCategory = categoryFilter.value;

    const filteredListings = listings.filter(function (item) {
      const matchesSearch =
        item.name.toLowerCase().includes(searchText) ||
        item.description.toLowerCase().includes(searchText) ||
        item.location.toLowerCase().includes(searchText) ||
        item.campus.toLowerCase().includes(searchText);

      const matchesCampus =
        selectedCampus === "" || item.campus === selectedCampus;

      const matchesCategory =
        selectedCategory === "" || item.category === selectedCategory;

      const matchesType = selectedType === "All" || item.type === selectedType;

      return matchesSearch && matchesCampus && matchesCategory && matchesType;
    });

    listingGrid.innerHTML = "";

    listingCount.textContent =
      filteredListings.length +
      (filteredListings.length === 1 ? " item" : " items");

    feedSubtitle.textContent =
      "Showing " + filteredListings.length + " matching listings.";

    if (filteredListings.length === 0) {
      listingGrid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px 20px">
                    <div style="font-size:40px;margin-bottom:12px">🔎</div>
                    <h3>No listings found</h3>
                    <p class="subtitle">Try changing your search or filters.</p>
                </div>
            `;

      return;
    }

    filteredListings.forEach(function (item) {
      const article = document.createElement("article");
      article.className = "item-card";

      const isLost = item.type === "Lost";

      const statusText = isLost ? "LOST ITEM" : "FOUND • AVAILABLE";
      const statusClass = isLost ? "lost" : "available";

      const imageContent =
        item.photos && item.photos.length > 0
          ? `<img src="${item.photos[0]}" alt="${escapeHTML(item.name)}"
                     style="width:100%;height:100%;object-fit:cover">`
          : `<div class="item-placeholder">${isLost ? "🔎" : "📦"}</div>`;

      article.innerHTML = `
                <a href="item-details.html?id=${encodeURIComponent(item.id)}"
                   class="item-image">
                    ${imageContent}
                    <span class="status ${statusClass}">${statusText}</span>
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

  // SEARCH
  searchInput.addEventListener("input", renderListings);

  // CAMPUS FILTER
  campusFilter.addEventListener("change", renderListings);

  // CATEGORY FILTER
  categoryFilter.addEventListener("change", renderListings);

  // LOST / FOUND FILTER BUTTONS
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

  renderListings();
}
