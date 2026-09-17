import { supabase } from "./supabase.js";
import { requireAdmin } from "./auth.js";

const recoveryTable =
    document.getElementById("recoveryTable");

const noRecoveries =
    document.getElementById("noRecoveries");

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


    const { data: profile } =
        await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();


    if (!profile || profile.role !== "admin") {

        alert("Admins only.");

        window.location.href =
            "dashboard.html";

        return false;

    }


    return true;

}


// =====================================================
// LOAD RECOVERIES
// =====================================================

async function loadRecoveries() {

    recoveryTable.innerHTML = `
        <tr>
            <td colspan="7"
                class="text-center py-4">

                Loading...

            </td>
        </tr>
    `;


    const { data, error } =
        await supabase
            .from("recoveries")
            .select(`
                id,
                item_id,
                matched_item_id,
                owner_id,
                finder_id,
                verification_status,
                created_at,

                item:items!recoveries_item_id_fkey (
                    item_name,
                    item_type,
                    image_url
                ),

                matched_item:items!recoveries_matched_item_id_fkey (
                    item_name,
                    item_type
                ),

                owner:profiles!recoveries_owner_id_fkey (
                    full_name,
                    student_id
                ),

                finder:profiles!recoveries_finder_id_fkey (
                    full_name,
                    student_id
                )
            `)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        recoveryTable.innerHTML = `
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


    recoveryTable.innerHTML = "";


    if (!data || data.length === 0) {

        noRecoveries.classList.remove(
            "d-none"
        );

        return;

    }


    noRecoveries.classList.add(
        "d-none"
    );


    data.forEach(recovery => {

        const statusBadge =
            recovery.verification_status ===
            "APPROVED"

            ? `<span class="badge bg-success">
                APPROVED
               </span>`

            : recovery.verification_status ===
              "REJECTED"

            ? `<span class="badge bg-danger">
                REJECTED
               </span>`

            : `<span class="badge bg-warning text-dark">
                PENDING
               </span>`;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <strong>
                    ${escapeHTML(
                        recovery.item?.item_name ||
                        "Unknown"
                    )}
                </strong>

                <br>

                <small class="text-muted">
                    LOST
                </small>

            </td>


            <td>

                <strong>
                    ${escapeHTML(
                        recovery.matched_item
                            ?.item_name ||
                        "Unknown"
                    )}
                </strong>

                <br>

                <small class="text-muted">
                    FOUND
                </small>

            </td>


            <td>

                ${escapeHTML(
                    recovery.owner
                        ?.full_name ||
                    "Unknown"
                )}

                <br>

                <small>
                    ${escapeHTML(
                        recovery.owner
                            ?.student_id ||
                        ""
                    )}
                </small>

            </td>


            <td>

                ${escapeHTML(
                    recovery.finder
                        ?.full_name ||
                    "Unknown"
                )}

                <br>

                <small>
                    ${escapeHTML(
                        recovery.finder
                            ?.student_id ||
                        ""
                    )}
                </small>

            </td>


            <td>
                ${statusBadge}
            </td>


            <td>
                ${formatDate(
                    recovery.created_at
                )}
            </td>


            <td>

                ${
                    recovery.verification_status ===
                    "PENDING"

                    ? `

                        <button
                            class="btn btn-success btn-sm mb-1"
                            data-action="approve"
                            data-id="${recovery.id}">

                            Approve

                        </button>


                        <button
                            class="btn btn-danger btn-sm"
                            data-action="reject"
                            data-id="${recovery.id}">

                            Reject

                        </button>

                      `

                    : "-"
                }

            </td>

        `;


        recoveryTable.appendChild(row);

    });

}


// =====================================================
// ACTIONS
// =====================================================

recoveryTable.addEventListener(
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


        if (action === "approve") {

            if (!confirm(
                "Approve this recovery?"
            )) {
                return;
            }


            const { error } =
                await supabase.rpc(
                    "approve_recovery",
                    {
                        p_recovery_id: id
                    }
                );


            if (error) {

                alert(error.message);

                return;

            }


            alert(
                "✅ Recovery approved. Both items are now recovered and finder received 100 points."
            );

        }


        if (action === "reject") {

            if (!confirm(
                "Reject this recovery?"
            )) {
                return;
            }


            const { error } =
                await supabase.rpc(
                    "reject_recovery",
                    {
                        p_recovery_id: id
                    }
                );


            if (error) {

                alert(error.message);

                return;

            }


            alert(
                "Recovery request rejected."
            );

        }


        await loadRecoveries();

    }
);


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener(
    "click",
    loadRecoveries
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await supabase.auth.signOut();

        window.location.href =
            "login.html";

    }
);


// =====================================================
// DATE
// =====================================================

function formatDate(value) {

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
// ESCAPE
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
    await loadRecoveries();
    
}