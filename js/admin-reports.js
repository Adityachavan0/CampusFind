import { supabase } from "./supabase.js";
import { requireAdmin } from "./auth.js";


const reportsTable =
    document.getElementById("reportsTable");

const noReports =
    document.getElementById("noReports");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// =====================================================
// CHECK ADMIN
// =====================================================

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href = "login.html";

        return false;

    }


    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();


    if (
        profileError ||
        !profile ||
        profile.role !== "admin"
    ) {

        alert("Access denied. Admins only.");

        window.location.href = "dashboard.html";

        return false;

    }


    return true;

}


// =====================================================
// LOAD REPORTS
// =====================================================

async function loadReports() {

    reportsTable.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Loading reports...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabase

            .from("reports")

            .select(`
                id,
                item_id,
                reported_by,
                reason,
                status,
                created_at,

                items (
                    item_name,
                    item_type
                ),

                profiles (
                    full_name,
                    student_id,
                    email
                )
            `)

            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error("Reports Error:", error);

        reportsTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="alert alert-danger">
                        ${escapeHTML(error.message)}
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    reportsTable.innerHTML = "";


    if (!data || data.length === 0) {

        noReports.classList.remove("d-none");

        return;

    }


    noReports.classList.add("d-none");


    data.forEach(report => {

        const itemName =
            report.items?.item_name || "Unknown Item";

        const itemType =
            report.items?.item_type || "UNKNOWN";

        const reporterName =
            report.profiles?.full_name || "Unknown";

        const studentId =
            report.profiles?.student_id || "";

        const status =
            report.status || "PENDING";


        let statusBadge;


        if (status === "PENDING") {

            statusBadge =
                `<span class="badge bg-warning text-dark">
                    PENDING
                </span>`;

        }
        else if (status === "REVIEWED") {

            statusBadge =
                `<span class="badge bg-success">
                    REVIEWED
                </span>`;

        }
        else {

            statusBadge =
                `<span class="badge bg-secondary">
                    DISMISSED
                </span>`;

        }


        const typeBadge =
            itemType === "LOST"

                ? `<span class="badge bg-danger">
                    LOST
                   </span>`

                : `<span class="badge bg-success">
                    FOUND
                   </span>`;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(itemName)}
                </strong>

                <br>

                <small class="text-muted">
                    Item ID: ${report.item_id}
                </small>
            </td>


            <td>
                ${typeBadge}
            </td>


            <td>

                ${escapeHTML(reporterName)}

                <br>

                <small class="text-muted">
                    ${escapeHTML(studentId)}
                </small>

            </td>


            <td style="max-width:250px">

                ${escapeHTML(report.reason)}

            </td>


            <td>
                ${statusBadge}
            </td>


            <td>
                ${formatDate(report.created_at)}
            </td>


            <td>

                ${
                    status === "PENDING"

                    ? `

                        <button
                            class="btn btn-success btn-sm mb-1"
                            data-action="review"
                            data-id="${report.id}">

                            Reviewed

                        </button>


                        <button
                            class="btn btn-secondary btn-sm mb-1"
                            data-action="dismiss"
                            data-id="${report.id}">

                            Dismiss

                        </button>

                      `

                    : `

                        <button
                            class="btn btn-outline-danger btn-sm"
                            data-action="delete"
                            data-id="${report.id}">

                            Delete

                        </button>

                      `
                }

            </td>

        `;


        reportsTable.appendChild(row);

    });

}


// =====================================================
// REPORT ACTIONS
// =====================================================

reportsTable.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest("button");


        if (!button) {
            return;
        }


        const reportId =
            button.dataset.id;

        const action =
            button.dataset.action;


        if (!reportId || !action) {
            return;
        }


        // ================= REVIEW =================

        if (action === "review") {

            const confirmed =
                confirm(
                    "Mark this report as reviewed?"
                );


            if (!confirmed) {
                return;
            }


            const { error } =
                await supabase
                    .from("reports")
                    .update({
                        status: "REVIEWED"
                    })
                    .eq("id", reportId);


            if (error) {

                alert(error.message);

                return;

            }

        }


        // ================= DISMISS =================

        if (action === "dismiss") {

            const confirmed =
                confirm(
                    "Dismiss this report?"
                );


            if (!confirmed) {
                return;
            }


            const { error } =
                await supabase
                    .from("reports")
                    .update({
                        status: "DISMISSED"
                    })
                    .eq("id", reportId);


            if (error) {

                alert(error.message);

                return;

            }

        }


        // ================= DELETE =================

        if (action === "delete") {

            const confirmed =
                confirm(
                    "Delete this report permanently?"
                );


            if (!confirmed) {
                return;
            }


            const { error } =
                await supabase
                    .from("reports")
                    .delete()
                    .eq("id", reportId);


            if (error) {

                alert(error.message);

                return;

            }

        }


        await loadReports();

    }
);


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener(
    "click",
    loadReports
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        const { error } =
            await supabase.auth.signOut();


        if (error) {

            alert(error.message);

            return;

        }


        window.location.href = "login.html";

    }
);


// =====================================================
// DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "Unknown";
    }


    return new Date(value)
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
    await loadReports();
}