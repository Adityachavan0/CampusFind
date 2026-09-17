import { supabase } from "./supabase.js";
import { requireLogin } from "./auth.js";

const itemsContainer = document.getElementById("itemsContainer");
const noItems = document.getElementById("noItems");
const resultCount = document.getElementById("resultCount");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");

let allItems = [];


// =====================================================
// CHECK LOGIN
// =====================================================

async function checkUser() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
    }

}


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    const { data, error } = await supabase
        .from("categories")
        .select("id, category_name")
        .order("category_name");

    if (error) {

        console.error("Category Error:", error);
        return;

    }

    data.forEach(category => {

        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.category_name;

        categoryFilter.appendChild(option);

    });

}


// =====================================================
// LOAD LOCATIONS
// =====================================================

async function loadLocations() {

    const { data, error } = await supabase
        .from("locations")
        .select("id, location_name")
        .order("location_name");

    if (error) {

        console.error("Location Error:", error);
        return;

    }

    data.forEach(location => {

        const option = document.createElement("option");

        option.value = location.id;
        option.textContent = location.location_name;

        locationFilter.appendChild(option);

    });

}


// =====================================================
// LOAD ITEMS
// =====================================================

async function loadItems() {

    itemsContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading items...</p>
        </div>
    `;

    const { data, error } = await supabase
        .from("items")
        .select(`
            id,
            user_id,
            item_type,
            item_name,
            description,
            image_url,
            item_date,
            item_time,
            status,
            approval_status,
            category_id,
            location_id,
            categories (
                category_name
            ),
            locations (
                location_name
            )
        `)
        .eq("approval_status", "APPROVED")
        .neq("status", "RECOVERED")
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Items Error:", error);

        itemsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    ${error.message}
                </div>
            </div>
        `;

        return;
    }

    allItems = data || [];

    displayItems(allItems);

}


// =====================================================
// DISPLAY ITEMS
// =====================================================

function displayItems(items) {

    itemsContainer.innerHTML = "";

    resultCount.textContent =
        `${items.length} Item${items.length !== 1 ? "s" : ""}`;


    if (items.length === 0) {

        noItems.style.display = "block";

        return;

    }

    noItems.style.display = "none";


    items.forEach(item => {

        const categoryName =
            item.categories?.category_name || "Other";

        const locationName =
            item.locations?.location_name || "Unknown";

        const isLost =
            item.item_type === "LOST";

        const badgeClass =
            isLost ? "bg-danger" : "bg-success";

        const typeText =
            isLost ? "LOST" : "FOUND";


        const imageHTML = item.image_url

            ? `
                <img
                    src="${item.image_url}"
                    class="card-img-top"
                    alt="${escapeHTML(item.item_name)}"
                    style="
                        height:220px;
                        object-fit:cover;
                    ">
              `

            : `
                <div
                    class="d-flex justify-content-center
                           align-items-center bg-light"
                    style="height:220px;">

                    <span class="fs-1">
                        📦
                    </span>

                </div>
              `;


        const card = document.createElement("div");

        card.className = "col-md-4 col-lg-3";


        card.innerHTML = `

            <div class="card h-100 shadow-sm border-0">

                ${imageHTML}

                <div class="card-body">

                    <span class="badge ${badgeClass} mb-2">
                        ${typeText}
                    </span>

                    <h5 class="card-title">
                        ${escapeHTML(item.item_name)}
                    </h5>

                    <p class="text-muted small mb-2">
                        ${escapeHTML(
                            item.description || "No description"
                        )}
                    </p>

                    <p class="small mb-1">
                        📂 ${escapeHTML(categoryName)}
                    </p>

                    <p class="small mb-1">
                        📍 ${escapeHTML(locationName)}
                    </p>

                    <p class="small text-muted">
                        📅 ${formatDate(item.item_date)}
                    </p>

                    <a
                        href="item-details.html?id=${item.id}"
                        class="btn btn-primary btn-sm w-100">

                        View Details

                    </a>

                </div>

            </div>

        `;

        itemsContainer.appendChild(card);

    });

}


// =====================================================
// FILTER ITEMS
// =====================================================

function filterItems() {

    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedType =
        typeFilter.value;

    const selectedCategory =
        categoryFilter.value;

    const selectedLocation =
        locationFilter.value;


    const filteredItems = allItems.filter(item => {

        const itemName =
            (item.item_name || "").toLowerCase();

        const description =
            (item.description || "").toLowerCase();


        // Search
        const matchesSearch =
            itemName.includes(searchText) ||
            description.includes(searchText);


        // Type
        const matchesType =
            selectedType === "ALL" ||
            item.item_type === selectedType;


        // Category
        const matchesCategory =
            selectedCategory === "ALL" ||
            String(item.category_id) === selectedCategory;


        // Location
        const matchesLocation =
            selectedLocation === "ALL" ||
            String(item.location_id) === selectedLocation;


        return (
            matchesSearch &&
            matchesType &&
            matchesCategory &&
            matchesLocation
        );

    });


    displayItems(filteredItems);

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "Unknown";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// =====================================================
// FILTER EVENTS
// =====================================================

searchInput.addEventListener("input", filterItems);

typeFilter.addEventListener("change", filterItems);

categoryFilter.addEventListener("change", filterItems);

locationFilter.addEventListener("change", filterItems);


// =====================================================
// START
// =====================================================
const user = await requireLogin();

if (user) {

    await loadCategories();
    await loadLocations();
    await loadItems();

}