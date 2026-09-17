import { supabase } from "./supabase.js";
import { requireAdmin, logout } from "./auth.js";

const totalItems = document.getElementById("totalItems");
const pendingItems = document.getElementById("pendingItems");
const lostItems = document.getElementById("lostItems");
const foundItems = document.getElementById("foundItems");

const pendingTable = document.getElementById("pendingTable");
const noPending = document.getElementById("noPending");

const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");


// =====================================================
// CHECK ADMIN
// =====================================================

async function checkAdmin() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {

        window.location.href = "login.html";
        return false;

    }


    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();


    if (profileError || !profile) {

        alert("Profile not found.");

        await supabase.auth.signOut();

        window.location.href = "login.html";

        return false;

    }


    if (profile.role !== "admin") {

        alert("Access denied. Admins only.");

        window.location.href = "dashboard.html";

        return false;

    }


    return true;

}


// =====================================================
// LOAD STATISTICS
// =====================================================

async function loadStatistics() {

    // Total
    const { count: total } =
        await supabase
            .from("items")
            .select("*", {
                count: "exact",
                head: true
            });

    totalItems.innerText = total || 0;


    // Pending
    const { count: pending } =
        await supabase
            .from("items")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("approval_status", "PENDING");

    pendingItems.innerText = pending || 0;


    // Lost
    const { count: lost } =
        await supabase
            .from("items")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("item_type", "LOST");

    lostItems.innerText = lost || 0;


    // Found
    const { count: found } =
        await supabase
            .from("items")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("item_type", "FOUND");

    foundItems.innerText = found || 0;

}


// =====================================================
// LOAD PENDING ITEMS
// =====================================================

async function loadPendingItems() {

    pendingTable.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                Loading...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabase
            .from("items")
            .select(`
                id,
                item_type,
                item_name,
                description,
                image_url,
                item_date,
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
            .eq("approval_status", "PENDING")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error("Pending Items Error:", error);

        pendingTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="alert alert-danger">
                        ${error.message}
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    pendingTable.innerHTML = "";


    if (!data || data.length === 0) {

        noPending.classList.remove("d-none");

        return;

    }


    noPending.classList.add("d-none");


    data.forEach(item => {

        const category =
            item.categories?.category_name || "Other";

        const location =
            item.locations?.location_name || "Unknown";


        const typeBadge =
            item.item_type === "LOST"

            ? `<span class="badge bg-danger">LOST</span>`

            : `<span class="badge bg-success">FOUND</span>`;


        const image =
            item.image_url

            ? `
                <img
                    src="${item.image_url}"
                    style="
                        width:60px;
                        height:60px;
                        object-fit:cover;
                        border-radius:8px;
                    "
                    alt="Item">
              `

            : `<span class="fs-3">📦</span>`;


        const row = document.createElement("tr");


        row.innerHTML = `

            <td>
                ${image}
            </td>

            <td>
                ${typeBadge}
            </td>

            <td>
                <strong>
                    ${escapeHTML(item.item_name)}
                </strong>
            </td>

            <td>
                ${escapeHTML(category)}
            </td>

            <td>
                ${escapeHTML(location)}
            </td>

            <td>
                ${formatDate(item.item_date)}
            </td>

            <td>

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

                <button
                    class="btn btn-danger btn-sm"
                    data-action="delete"
                    data-id="${item.id}">

                    Delete

                </button>

            </td>

        `;


        pendingTable.appendChild(row);

    });

}


// =====================================================
// APPROVE / REJECT / DELETE
// =====================================================

pendingTable.addEventListener("click", async (event) => {

    const button =
        event.target.closest("button");

    if (!button) {
        return;
    }


    const id =
        button.dataset.id;

    const action =
        button.dataset.action;


    if (!id || !action) {
        return;
    }


    // ================= APPROVE =================

    if (action === "approve") {

        const confirmed =
            confirm("Approve this item?");

        if (!confirmed) {
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


        alert("Item approved successfully.");

    }


    // ================= REJECT =================

    if (action === "reject") {

        const confirmed =
            confirm("Reject this item?");

        if (!confirmed) {
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


        alert("Item rejected.");

    }


    // ================= DELETE =================

    if (action === "delete") {

        const confirmed =
            confirm(
                "Are you sure you want to permanently delete this item?"
            );

        if (!confirmed) {
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


        alert("Item deleted.");

    }


    // Refresh
    await loadStatistics();
    await loadPendingItems();

});


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener("click", async () => {

    const { error } =
        await supabase.auth.signOut();


    if (error) {

        alert(error.message);
        return;

    }


    window.location.href = "login.html";

});


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener("click", async () => {

    await loadStatistics();
    await loadPendingItems();

});


// =====================================================
// DATE
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "Unknown";
    }

    return new Date(dateString)
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

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

const admin = await requireAdmin();

if (admin) {

    await loadStatistics();
    await loadPendingItems();

}