import { supabase } from "./supabase.js";
import { requireLogin } from "./auth.js";

const leaderboardTable =
    document.getElementById("leaderboardTable");

const topStudents =
    document.getElementById("topStudents");

const noStudents =
    document.getElementById("noStudents");


// =====================================================
// CHECK LOGIN
// =====================================================

async function checkUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href = "login.html";

        return false;

    }


    return true;

}


// =====================================================
// LOAD LEADERBOARD
// =====================================================

async function loadLeaderboard() {

    leaderboardTable.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                Loading leaderboard...
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
                points
            `)
            .order("points", {
                ascending: false
            })
            .order("full_name", {
                ascending: true
            });


    if (error) {

        console.error(
            "Leaderboard Error:",
            error
        );

        leaderboardTable.innerHTML = `
            <tr>
                <td colspan="4">

                    <div class="alert alert-danger">
                        ${escapeHTML(error.message)}
                    </div>

                </td>
            </tr>
        `;

        return;

    }


    if (!data || data.length === 0) {

        leaderboardTable.innerHTML = "";

        noStudents.classList.remove(
            "d-none"
        );

        return;

    }


    noStudents.classList.add(
        "d-none"
    );


    // ---------------------------------------------
    // DISPLAY TOP 3
    // ---------------------------------------------

    displayTopStudents(data);


    // ---------------------------------------------
    // DISPLAY TABLE
    // ---------------------------------------------

    leaderboardTable.innerHTML = "";


    data.forEach((student, index) => {

        const rank = index + 1;

        let rankDisplay;


        if (rank === 1) {

            rankDisplay = "🥇";

        }
        else if (rank === 2) {

            rankDisplay = "🥈";

        }
        else if (rank === 3) {

            rankDisplay = "🥉";

        }
        else {

            rankDisplay = rank;

        }


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td class="fw-bold">

                ${rankDisplay}

            </td>


            <td>

                <strong>
                    ${escapeHTML(
                        student.full_name ||
                        "Student"
                    )}
                </strong>

            </td>


            <td>

                ${escapeHTML(
                    student.student_id ||
                    ""
                )}

            </td>


            <td>

                <span
                    class="badge bg-warning text-dark">

                    ⭐ ${student.points || 0}

                </span>

            </td>

        `;


        leaderboardTable.appendChild(row);

    });

}


// =====================================================
// TOP THREE
// =====================================================

function displayTopStudents(data) {

    topStudents.innerHTML = "";


    const topThree =
        data.slice(0, 3);


    topThree.forEach((student, index) => {

        const rank =
            index + 1;


        const col =
            document.createElement("div");


        col.className =
            "col-md-4";


        let medal;

        if (rank === 1) {
            medal = "🥇";
        }
        else if (rank === 2) {
            medal = "🥈";
        }
        else {
            medal = "🥉";
        }


        col.innerHTML = `

            <div
                class="card shadow-sm border-0 h-100 text-center">

                <div class="card-body p-4">

                    <div class="display-4">
                        ${medal}
                    </div>

                    <h4 class="mt-3">

                        ${escapeHTML(
                            student.full_name ||
                            "Student"
                        )}

                    </h4>

                    <p class="text-muted mb-2">

                        ${escapeHTML(
                            student.student_id ||
                            ""
                        )}

                    </p>

                    <h3 class="text-warning">

                        ⭐ ${student.points || 0}

                        <small class="fs-6">
                            points
                        </small>

                    </h3>

                </div>

            </div>

        `;


        topStudents.appendChild(col);

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

const user = await requireLogin();

if (user) {
    await loadLeaderboard();
}