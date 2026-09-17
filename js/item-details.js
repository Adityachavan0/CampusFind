import { supabase } from "./supabase.js";


// =====================================================
// HTML ELEMENTS
// =====================================================

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const itemDetails = document.getElementById("itemDetails");

const itemImage = document.getElementById("itemImage");
const noImage = document.getElementById("noImage");

const itemType = document.getElementById("itemType");
const itemStatus = document.getElementById("itemStatus");

const itemName = document.getElementById("itemName");
const itemDescription = document.getElementById("itemDescription");
const itemCategory = document.getElementById("itemCategory");
const itemLocation = document.getElementById("itemLocation");
const itemDate = document.getElementById("itemDate");
const itemTime = document.getElementById("itemTime");

const actionBtn = document.getElementById("actionBtn");

const matchesSection = document.getElementById("matchesSection");
const matchesContainer = document.getElementById("matchesContainer");


// =====================================================
// GET ITEM ID FROM URL
// Example: item-details.html?id=10
// =====================================================

const urlParams = new URLSearchParams(window.location.search);

const itemId = urlParams.get("id");


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let currentUser = null;
let currentItem = null;


// =====================================================
// LOAD ITEM DETAILS
// =====================================================

async function loadItemDetails() {

    if (!itemId) {

        showError("Item ID is missing.");

        return;
    }


    // -------------------------------------------------
    // Check logged-in user
    // -------------------------------------------------

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();


    if (userError || !user) {

        window.location.href = "login.html";

        return;
    }


    currentUser = user;


    // -------------------------------------------------
    // Get item from database
    // -------------------------------------------------

    const { data: item, error } =
        await supabase
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
            .eq("id", itemId)
            .maybeSingle();


    if (error) {

        console.error("Item Error:", error);

        showError(error.message);

        return;
    }


    if (!item) {

        showError("Item not found.");

        return;
    }


    // -------------------------------------------------
    // Check whether item can be viewed
    // -------------------------------------------------

    if (
        item.approval_status !== "APPROVED" &&
        item.user_id !== currentUser.id
    ) {

        showError(
            "This item is not available for viewing yet."
        );

        return;
    }


    currentItem = item;


    // -------------------------------------------------
    // Display item
    // -------------------------------------------------

    displayItem(item);


    // -------------------------------------------------
    // Find possible matches
    // -------------------------------------------------

    await loadMatches(item);

}


// =====================================================
// DISPLAY ITEM
// =====================================================

function displayItem(item) {

    loading.classList.add("d-none");

    itemDetails.classList.remove("d-none");


    // -------------------------------------------------
    // Item Type
    // -------------------------------------------------

    if (item.item_type === "LOST") {

        itemType.innerText = "LOST";

        itemType.className =
            "badge bg-danger";

    } else {

        itemType.innerText = "FOUND";

        itemType.className =
            "badge bg-success";

    }


    // -------------------------------------------------
    // Item Status
    // -------------------------------------------------

    itemStatus.innerText =
        item.status || "ACTIVE";


    if (item.status === "RECOVERED") {

        itemStatus.className =
            "badge bg-secondary ms-2";

    }
    else if (item.status === "MATCHED") {

        itemStatus.className =
            "badge bg-warning text-dark ms-2";

    }
    else {

        itemStatus.className =
            "badge bg-primary ms-2";

    }


    // -------------------------------------------------
    // Item Name
    // -------------------------------------------------

    itemName.innerText =
        item.item_name || "Unnamed Item";


    // -------------------------------------------------
    // Description
    // -------------------------------------------------

    itemDescription.innerText =
        item.description ||
        "No description provided.";


    // -------------------------------------------------
    // Category
    // -------------------------------------------------

    itemCategory.innerText =
        item.categories?.category_name ||
        "Other";


    // -------------------------------------------------
    // Location
    // -------------------------------------------------

    itemLocation.innerText =
        item.locations?.location_name ||
        "Unknown";


    // -------------------------------------------------
    // Date
    // -------------------------------------------------

    itemDate.innerText =
        formatDate(item.item_date);


    // -------------------------------------------------
    // Time
    // -------------------------------------------------

    itemTime.innerText =
        item.item_time || "Not specified";


    // -------------------------------------------------
    // Image
    // -------------------------------------------------

    if (item.image_url) {

        itemImage.src = item.image_url;

        itemImage.classList.remove("d-none");

        noImage.classList.add("d-none");

    } else {

        itemImage.classList.add("d-none");

        noImage.classList.remove("d-none");

    }


    // -------------------------------------------------
    // Change action button text
    // -------------------------------------------------

    if (item.item_type === "LOST") {

        actionBtn.innerText =
            "🚩 Report This Item";

    } else {

        actionBtn.innerText =
            "🚩 Report This Item";

    }

}


// =====================================================
// FIND POSSIBLE MATCHES
// =====================================================

async function loadMatches(item) {

    /*
        If current item is LOST:
            Search FOUND items

        If current item is FOUND:
            Search LOST items
    */

    const oppositeType =
        item.item_type === "LOST"
            ? "FOUND"
            : "LOST";


    const { data, error } =
        await supabase
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
            .eq("item_type", oppositeType)
            .eq("approval_status", "APPROVED")
            .neq("status", "RECOVERED");


    if (error) {

        console.error(
            "Matching Error:",
            error
        );

        return;
    }


    if (!data || data.length === 0) {

        return;
    }


    // -------------------------------------------------
    // Calculate score
    // -------------------------------------------------

    const matches =
        data
            .map(candidate => {

                return {

                    item: candidate,

                    score:
                        calculateMatchScore(
                            item,
                            candidate
                        )

                };

            })

            .filter(match => match.score >= 40)

            .sort(
                (a, b) =>
                    b.score - a.score
            )

            .slice(0, 6);


    if (matches.length === 0) {

        return;
    }


    matchesSection.classList.remove("d-none");

    matchesContainer.innerHTML = "";


    matches.forEach(match => {

        createMatchCard(
            match.item,
            match.score
        );

    });

}


// =====================================================
// CALCULATE MATCH SCORE
// =====================================================

function calculateMatchScore(item, candidate) {

    let score = 0;


    // -------------------------------------------------
    // SAME CATEGORY = 40
    // -------------------------------------------------

    if (
        item.category_id &&
        candidate.category_id &&
        Number(item.category_id) ===
        Number(candidate.category_id)
    ) {

        score += 40;

    }


    // -------------------------------------------------
    // SAME LOCATION = 30
    // -------------------------------------------------

    if (
        item.location_id &&
        candidate.location_id &&
        Number(item.location_id) ===
        Number(candidate.location_id)
    ) {

        score += 30;

    }


    // -------------------------------------------------
    // SAME / NEAR DATE = 15
    // -------------------------------------------------

    if (
        item.item_date &&
        candidate.item_date
    ) {

        const date1 =
            new Date(item.item_date);

        const date2 =
            new Date(candidate.item_date);

        const difference =
            Math.abs(date1 - date2) /
            (1000 * 60 * 60 * 24);


        if (difference === 0) {

            score += 15;

        }
        else if (difference <= 2) {

            score += 10;

        }
        else if (difference <= 7) {

            score += 5;

        }

    }


    // -------------------------------------------------
    // SIMILAR ITEM NAME = 10
    // -------------------------------------------------

    if (
        textMatches(
            item.item_name,
            candidate.item_name
        )
    ) {

        score += 10;

    }


    // -------------------------------------------------
    // SIMILAR DESCRIPTION = 5
    // -------------------------------------------------

    if (
        textMatches(
            item.description,
            candidate.description
        )
    ) {

        score += 5;

    }


    return score;

}


// =====================================================
// TEXT MATCH
// =====================================================

function textMatches(text1, text2) {

    if (!text1 || !text2) {

        return false;
    }


    const words1 =
        cleanText(text1)
            .split(" ")
            .filter(
                word => word.length >= 3
            );


    const words2 =
        cleanText(text2)
            .split(" ")
            .filter(
                word => word.length >= 3
            );


    return words1.some(
        word => words2.includes(word)
    );

}


// =====================================================
// CLEAN TEXT
// =====================================================

function cleanText(text) {

    return String(text)
        .toLowerCase()
        .replace(
            /[^a-z0-9\s]/g,
            ""
        );

}


// =====================================================
// CREATE MATCH CARD
// =====================================================

function createMatchCard(item, score) {

    const col =
        document.createElement("div");

    col.className =
        "col-md-6 col-lg-4";


    // -------------------------------------------------
    // Image
    // -------------------------------------------------

    const imageHTML = item.image_url

        ? `
            <img
                src="${item.image_url}"
                class="card-img-top"
                alt="Item"
                style="
                    height:180px;
                    object-fit:cover;
                ">
          `

        : `
            <div
                class="d-flex justify-content-center
                       align-items-center bg-light"
                style="height:180px;">

                <span class="fs-1">
                    📦
                </span>

            </div>
          `;


    // -------------------------------------------------
    // Badge
    // -------------------------------------------------

    const badge =
        item.item_type === "LOST"

            ? `
                <span class="badge bg-danger">
                    LOST
                </span>
              `

            : `
                <span class="badge bg-success">
                    FOUND
                </span>
              `;


    /*
        IMPORTANT:

        Request Recovery appears ONLY when:

        1. Current item is LOST
        2. Current logged-in user owns that LOST item
    */

    const canRequestRecovery =
        currentUser &&
        currentItem &&
        currentItem.item_type === "LOST" &&
        currentItem.user_id === currentUser.id;


    const recoveryButton =
        canRequestRecovery

            ? `
                <button
                    type="button"
                    class="btn btn-success btn-sm w-100 mt-2"
                    data-action="recovery"
                    data-match-id="${item.id}">

                    🤝 Request Recovery

                </button>
              `

            : "";


    // -------------------------------------------------
    // Card
    // -------------------------------------------------

    col.innerHTML = `

        <div class="card h-100 shadow-sm border-0">

            ${imageHTML}

            <div class="card-body">

                ${badge}

                <h5 class="mt-2">
                    ${escapeHTML(
                        item.item_name ||
                        "Unnamed Item"
                    )}
                </h5>


                <p class="small text-muted mb-2">

                    📂
                    ${escapeHTML(
                        item.categories?.category_name ||
                        "Other"
                    )}

                    <br>

                    📍
                    ${escapeHTML(
                        item.locations?.location_name ||
                        "Unknown"
                    )}

                    <br>

                    📅
                    ${formatDate(
                        item.item_date
                    )}

                </p>


                <div class="mb-3">

                    <strong>
                        Match: ${score}%
                    </strong>


                    <div class="progress mt-2">

                        <div
                            class="progress-bar"
                            role="progressbar"
                            style="width:${score}%">

                        </div>

                    </div>

                </div>


                <a
                    href="item-details.html?id=${item.id}"
                    class="btn btn-primary btn-sm w-100">

                    View Match

                </a>


                ${recoveryButton}

            </div>

        </div>

    `;


    matchesContainer.appendChild(col);

}


// =====================================================
// REQUEST RECOVERY
// =====================================================

matchesContainer.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                'button[data-action="recovery"]'
            );


        if (!button) {
            return;
        }


        // -------------------------------------------------
        // Check user
        // -------------------------------------------------

        if (!currentUser) {

            alert(
                "Please login first."
            );

            window.location.href =
                "login.html";

            return;
        }


        // -------------------------------------------------
        // IMPORTANT SECURITY CHECK
        // -------------------------------------------------

        if (
            !currentItem ||
            currentItem.item_type !== "LOST" ||
            currentItem.user_id !== currentUser.id
        ) {

            alert(
                "Only the owner of the lost item can request recovery."
            );

            return;
        }


        const matchedItemId =
            Number(button.dataset.matchId);


        if (!matchedItemId) {

            alert(
                "Matched item not found."
            );

            return;
        }


        // -------------------------------------------------
        // Confirmation
        // -------------------------------------------------

        const confirmed =
            confirm(
                "Do you want to request recovery for this found item?"
            );


        if (!confirmed) {
            return;
        }


        // -------------------------------------------------
        // Get matched FOUND item
        // -------------------------------------------------

        const {
            data: matchedItem,
            error: matchedItemError
        } = await supabase
            .from("items")
            .select(`
                id,
                user_id,
                item_type,
                status,
                approval_status
            `)
            .eq("id", matchedItemId)
            .single();


        if (matchedItemError) {

            console.error(
                "Matched Item Error:",
                matchedItemError
            );

            alert(
                matchedItemError.message
            );

            return;
        }


        if (!matchedItem) {

            alert(
                "Matched item not found."
            );

            return;
        }


        // -------------------------------------------------
        // Must be FOUND
        // -------------------------------------------------

        if (
            matchedItem.item_type !== "FOUND"
        ) {

            alert(
                "Recovery can only be requested for a FOUND item."
            );

            return;
        }


        // -------------------------------------------------
        // Must be approved
        // -------------------------------------------------

        if (
            matchedItem.approval_status !==
            "APPROVED"
        ) {

            alert(
                "The found item is not approved yet."
            );

            return;
        }


        // -------------------------------------------------
        // Must not be recovered
        // -------------------------------------------------

        if (
            matchedItem.status ===
            "RECOVERED"
        ) {

            alert(
                "This item has already been recovered."
            );

            return;
        }


        // -------------------------------------------------
        // Check duplicate recovery
        // -------------------------------------------------

        const {
            data: existingRecovery,
            error: existingRecoveryError
        } = await supabase
            .from("recoveries")
            .select("id, verification_status")
            .eq(
                "item_id",
                currentItem.id
            )
            .eq(
                "matched_item_id",
                matchedItem.id
            )
            .maybeSingle();


        if (existingRecoveryError) {

            console.error(
                "Recovery Check Error:",
                existingRecoveryError
            );

            alert(
                existingRecoveryError.message
            );

            return;
        }


        if (existingRecovery) {

            alert(
                `A recovery request already exists.
                
Status: ${existingRecovery.verification_status}`
            );

            return;
        }


        // -------------------------------------------------
        // Insert recovery request
        // -------------------------------------------------

        const {
            error: recoveryError
        } = await supabase
            .from("recoveries")
            .insert({

                item_id:
                    currentItem.id,

                matched_item_id:
                    matchedItem.id,

                owner_id:
                    currentItem.user_id,

                finder_id:
                    matchedItem.user_id,

                requested_by:
                    currentUser.id,

                notes:
                    "Recovery requested by lost item owner.",

                verification_status:
                    "PENDING"

            });


        if (recoveryError) {

            console.error(
                "Recovery Insert Error:",
                recoveryError
            );

            alert(
                recoveryError.message
            );

            return;
        }


        // -------------------------------------------------
        // Success
        // -------------------------------------------------

        alert(
            "✅ Recovery request sent to admin."
        );


        // Disable clicked button

        button.disabled = true;

        button.innerText =
            "⏳ Recovery Requested";

        button.classList.remove(
            "btn-success"
        );

        button.classList.add(
            "btn-secondary"
        );

    }
);


// =====================================================
// REPORT ITEM
// =====================================================

actionBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {

            window.location.href =
                "login.html";

            return;
        }


        const reason =
            prompt(
                "Why are you reporting this item?"
            );


        if (reason === null) {
            return;
        }


        const cleanReason =
            reason.trim();


        if (!cleanReason) {

            alert(
                "Please enter a reason."
            );

            return;
        }


        const {
            error
        } = await supabase
            .from("reports")
            .insert({

                item_id:
                    Number(itemId),

                reported_by:
                    currentUser.id,

                reason:
                    cleanReason,

                status:
                    "PENDING"

            });


        if (error) {

            console.error(
                "Report Error:",
                error
            );

            alert(
                error.message
            );

            return;
        }


        alert(
            "✅ Report submitted successfully."
        );

    }
);


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateString) {

    if (!dateString) {

        return "Not specified";
    }


    return new Date(dateString)
        .toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}


// =====================================================
// SHOW ERROR
// =====================================================

function showError(message) {

    loading.classList.add("d-none");

    itemDetails.classList.add("d-none");

    errorMessage.classList.remove("d-none");

    errorMessage.innerText =
        message;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// START
// =====================================================

loadItemDetails();