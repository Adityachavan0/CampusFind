import { supabase } from "./supabase.js";
import { requireAdmin } from "./auth.js";

const usersTable = document.getElementById("usersTable");
const noUsers = document.getElementById("noUsers");

const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

let users = [];


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


    if (profileError || profile?.role !== "admin") {

        alert("Access denied. Admins only.");

        window.location.href = "dashboard.html";

        return false;

    }


    return true;

}


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {

    usersTable.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Loading users...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabase
            .from("profiles")
            .select(`
                id,
                full_name,
                student_id,
                email,
                role,
                points,
                created_at
            `)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error("Users Error:", error);

        usersTable.innerHTML = `
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


    users = data || [];

    displayUsers(users);

}


// =====================================================
// DISPLAY USERS
// =====================================================

function displayUsers(data) {

    usersTable.innerHTML = "";


    if (data.length === 0) {

        noUsers.classList.remove("d-none");

        return;

    }


    noUsers.classList.add("d-none");


    data.forEach(user => {

        const row = document.createElement("tr");

        const roleBadge =
            user.role === "admin"
                ? `<span class="badge bg-danger">ADMIN</span>`
                : `<span class="badge bg-primary">STUDENT</span>`;


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(user.full_name)}
                </strong>
            </td>

            <td>
                ${escapeHTML(user.student_id)}
            </td>

            <td>
                ${escapeHTML(user.email)}
            </td>

            <td>
                ${roleBadge}
            </td>

            <td>
                <strong>
                    ${user.points}
                </strong>
            </td>

            <td>
                ${formatDate(user.created_at)}
            </td>

            <td>

                <button
                    class="btn btn-sm btn-warning"
                    data-action="edit"
                    data-id="${user.id}">

                    Edit

                </button>

            </td>

        `;


        usersTable.appendChild(row);

    });

}


// =====================================================
// EDIT USER
// =====================================================

usersTable.addEventListener("click", async (event) => {

    const button =
        event.target.closest("button");

    if (!button) {
        return;
    }


    const userId =
        button.dataset.id;

    if (button.dataset.action !== "edit") {
        return;
    }


    const user =
        users.find(u => u.id === userId);

    if (!user) {
        return;
    }


    const newRole =
        prompt(
            `Enter role for ${user.full_name}:\n\nstudent or admin`,
            user.role
        );


    if (newRole === null) {
        return;
    }


    const role =
        newRole.trim().toLowerCase();


    if (role !== "student" && role !== "admin") {

        alert("Role must be student or admin.");

        return;

    }


    const newPoints =
        prompt(
            `Enter points for ${user.full_name}:`,
            user.points
        );


    if (newPoints === null) {
        return;
    }


    const points =
        Number(newPoints);


    if (!Number.isInteger(points) || points < 0) {

        alert("Points must be a non-negative whole number.");

        return;

    }


    // Update
    const { error } =
        await supabase
            .from("profiles")
            .update({
                role: role,
                points: points
            })
            .eq("id", userId);


    if (error) {

        alert(error.message);

        return;

    }


    alert("User updated successfully.");

    await loadUsers();

});


// =====================================================
// SEARCH
// =====================================================

searchInput.addEventListener("input", () => {

    const text =
        searchInput.value.trim().toLowerCase();


    const filtered =
        users.filter(user => {

            return (
                (user.full_name || "")
                    .toLowerCase()
                    .includes(text)
                ||

                (user.student_id || "")
                    .toLowerCase()
                    .includes(text)
                ||

                (user.email || "")
                    .toLowerCase()
                    .includes(text)
            );

        });


    displayUsers(filtered);

});


// =====================================================
// REFRESH
// =====================================================

refreshBtn.addEventListener("click", loadUsers);


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
    await loadUsers();
}