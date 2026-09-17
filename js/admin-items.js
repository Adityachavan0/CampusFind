import { supabase } from "./supabase.js";
import { requireAdmin, logout } from "./auth.js";


// =====================================================
// ELEMENTS
// =====================================================

const itemsTable =
    document.getElementById("itemsTable");

const noItems =
    document.getElementById("noItems");

const itemCount =
    document.getElementById("itemCount");

const searchInput =
    document.getElementById("searchInput");

const typeFilter =
    document.getElementById("typeFilter");

const approvalFilter =
    document.getElementById("approvalFilter");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


let allItems = [];


// =====================================================
// LOAD ITEMS
// =====================================================

async function loadItems() {

    itemsTable.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4">
                Loading items...
            </td>
        </tr>
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
            created_at,
            categories (
                category_name
            ),
            locations (
                location_name
            ),
            profiles (
                full_name,
                student_id
            )
        `)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error("Admin Items Error:", error);

        itemsTable.innerHTML = `
            <tr>
                <td colspan="9">

                    <div class="alert alert-danger">
                        ${escapeHTML(error.message)}
                    </div>

                </td>
            </tr>
        `;

        return;
    }


    allItems = data || [];

    filterItems();

}


// =====================================================
// DISPLAY ITEMS
// =====================================================

function displayItems(items) {

    itemsTable.innerHTML = "";


    itemCount.innerText =
        `${items.length} Item${items.length !== 1 ? "s" : ""}`;


    if (items.length === 0) {

        noItems.classList.remove("d-none");

        return;

    }


    noItems.classList.add("d-none");


    items.forEach(item => {

        const row =
            document.createElement("tr");


        // ================= IMAGE =================

        const imageHTML = item.image_url

            ? `
                <img
                    src="${item.image_url}"
                    alt="Item"
                    style="
                        width:60px;
                        height:60px;
                        object-fit:cover;
                        border-radius:8px;
                    ">
              `

            : `
                <span class="fs-3">
                    📦
                </span>
              `;


        // ================= TYPE =================

        const typeBadge =
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


        // ================= APPROVAL =================

        let approvalBadge;


        if (item.approval_status === "PENDING") {

            approvalBadge = `
                <span class="badge bg-warning text-dark">
                    PENDING
                </span>
            `;

        }
        else if (item.approval_status === "APPROVED") {

            approvalBadge = `
                <span class="badge bg-success">
                    APPROVED
                </span>
            `;

        }
        else {

            approvalBadge = `
                <span class="badge bg-danger">
                    REJECTED
                </span>
            `;

        }


        // ================= STATUS =================

        let statusBadge;


        if (item.status === "ACTIVE") {

            statusBadge = `
                <span class="badge bg-primary">
                    ACTIVE
                </span>
            `;

        }
        else if (item.status === "MATCHED") {

            statusBadge = `
                <span class="badge bg-warning text-dark">
                    MATCHED
                </span>
            `;

        }
        else {

            statusBadge = `
                <span class="badge bg-secondary">
                    RECOVERED
                </span>
            `;

        }


        // ================= ACTIONS =================

        let actionHTML = `
            <a
                href="item-details.html?id=${item.id}"
                class="btn btn-primary btn-sm mb-1">

                View

            </a>
        `;


        // Approval buttons

        if (item.approval_status === "PENDING") {

            actionHTML += `

                <button
                    class="btn btn-success btn-sm mb-1"
                    data-action="approve"
                    data-id="${item.id}">

                    Approve

                </button>


                <button
                    class="btn btn-warning btn-sm mb-1"
                    data-action="reject"
                    data-id="${item.id}">

                    Reject

                </button>

            `;

        }


        // Change matched/recovered

        if (
            item.approval_status === "APPROVED" &&
            item.status === "ACTIVE"
        ) {

            actionHTML += `

                <button
                    class="btn btn-warning btn-sm mb-1"
                    data-action="matched"
                    data-id="${item.id}">

                    Mark Matched

                </button>

            `;

        }


        if (
            item.approval_status === "APPROVED" &&
            item.status === "MATCHED"
        ) {

            actionHTML += `

                <button
                    class="btn btn-success btn-sm mb-1"
                    data-action="recovered"
                    data-id="${item.id}">

                    Mark Recovered

                </button>

            `;

        }


        // Delete

        actionHTML += `

            <button
                class="btn btn-danger btn-sm"
                data-action="delete"
                data-id="${item.id}">

                Delete

            </button>

        `;


        // ================= ROW =================

        row.innerHTML = `

            <td>
                ${imageHTML}
            </td>


            <td>

                <strong>
                    ${escapeHTML(
                        item.item_name || "Unnamed"
                    )}
                </strong>

                <br>

                <small class="text-muted">

                    ${escapeHTML(
                        item.profiles?.full_name ||
                        "Unknown user"
                    )}

                </small>

            </td>


            <td>
                ${typeBadge}
            </td>


            <td>

                ${escapeHTML(
                    item.categories?.category_name ||
                    "Other"
                )}

            </td>


            <td>

                ${escapeHTML(
                    item.locations?.location_name ||
                    "Unknown"
                )}

            </td>


            <td>
                ${approvalBadge}
            </td>


            <td>
                ${statusBadge}
            </td>


            <td>
                ${formatDate(item.item_date)}
            </td>


            <td>
                ${actionHTML}
            </td>

        `;


        itemsTable.appendChild(row);

    });

}


// =====================================================
// FILTER
// =====================================================

function filterItems() {

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedType =
        typeFilter.value;

    const selectedApproval =
        approvalFilter.value;

    const selectedStatus =
        statusFilter.value;


    const filtered =
        allItems.filter(item => {

            const itemName =
                (item.item_name || "")
                    .toLowerCase();


            const description =
                (item.description || "")
                    .toLowerCase();


            const studentName =
                (item.profiles?.full_name || "")
                    .toLowerCase();


            const studentId =
                (item.profiles?.student_id || "")
                    .toLowerCase();


            const matchesSearch =
                itemName.includes(searchText) ||
                description.includes(searchText) ||
                studentName.includes(searchText) ||
                studentId.includes(searchText);


            const matchesType =
                selectedType === "ALL" ||
                item.item_type === selectedType;


            const matchesApproval =
                selectedApproval === "ALL" ||
                item.approval_status === selectedApproval;


            const matchesStatus =
                selectedStatus === "ALL" ||
                item.status === selectedStatus;


            return (
                matchesSearch &&
                matchesType &&
                matchesApproval &&
                matchesStatus
            );

        });


    displayItems(filtered);

}


// =====================================================
// ITEM ACTIONS
// =====================================================

itemsTable.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest("button");


        if (!button) {
            return;
        }


        const id =
            Number(button.dataset.id);

        const action =
            button.dataset.action;


        if (!id || !action) {
            return;
        }


        // ==========================================
        // APPROVE
        // ==========================================

        if (action === "approve") {

            if (!confirm(
                "Approve this item?"
            )) {

                return;
            }


            const { error } =
                await supabase
                    .from("items")
                    .update({
                        approval_status: "APPROVED"
                    })
                    .eq("id", id);


            if (error) {

                alert(error.message);
                return;

            }


            alert(
                "✅ Item approved."
            );

        }


        // ==========================================
        // REJECT
        // ==========================================

        if (action === "reject") {

            if (!confirm(
                "Reject this item?"
            )) {

                return;
            }


            const { error } =
                await supabase
                    .from("items")
                    .update({
                        approval_status: "REJECTED"
                    })
                    .eq("id", id);


            if (error) {

                alert(error.message);
                return;

            }


            alert(
                "Item rejected."
            );

        }


        // ==========================================
        // MARK MATCHED
        // ==========================================

        if (action === "matched") {

            if (!confirm(
                "Mark this item as MATCHED?"
            )) {

                return;
            }


            const { error } =
                await supabase
                    .from("items")
                    .update({
                        status: "MATCHED"
                    })
                    .eq("id", id);


            if (error) {

                alert(error.message);
                return;

            }


            alert(
                "Item marked as matched."
            );

        }


        // ==========================================
        // MARK RECOVERED
        // ==========================================

        if (action === "recovered") {

            if (!confirm(
                "Mark this item as RECOVERED?"
            )) {

                return;
            }


            const { error } =
                await supabase
                    .from("items")
                    .update({
                        status: "RECOVERED"
                    })
                    .eq("id", id);


            if (error) {

                alert(error.message);
                return;

            }


            alert(
                "Item marked as recovered."
            );

        }


        // ==========================================
        // DELETE
        // ==========================================

        if (action === "delete") {

            if (!confirm(
                "Are you sure you want to permanently delete this item?"
            )) {

                return;
            }


            const { error } =
                await supabase
                    .from("items")
                    .delete()
                    .eq("id", id);


            if (error) {

                alert(error.message);
                return;

            }


            alert(
                "Item deleted."
            );

        }


        await loadItems();

    }
);


// =====================================================
// FILTER EVENTS
// =====================================================

searchInput.addEventListener(
    "input",
    filterItems
);

typeFilter.addEventListener(
    "change",
    filterItems
);

approvalFilter.addEventListener(
    "change",
    filterItems
);

statusFilter.addEventListener(
    "change",
    filterItems
);


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener(
    "click",
    loadItems
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    logout
);


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(value) {

    if (!value) {
        return "Unknown";
    }


    return new Date(value)
        .toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

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
// START
// =====================================================

const admin =
    await requireAdmin();


if (admin) {

    await loadItems();

} 