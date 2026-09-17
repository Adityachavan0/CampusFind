import { supabase } from "./supabase.js";
import { requireLogin, logout } from "./auth.js";

const userName = document.getElementById("userName");
const userPoints = document.getElementById("userPoints");
const lostCount = document.getElementById("lostCount");
const foundCount = document.getElementById("foundCount");
const logoutBtn = document.getElementById("logoutBtn");


// ================= LOAD DASHBOARD =================

async function loadDashboard() {

    // Get logged-in user
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {

        window.location.href = "login.html";
        return;
    }


    // Get profile
    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();


    if (profileError) {

        console.error(profileError);

        alert("Unable to load profile.");
        return;
    }


    // Display profile information

    userName.innerText = profile.full_name;
    userPoints.innerText = profile.points;


    // Get LOST items count
    const { count: lostItems, error: lostError } =
        await supabase
            .from("items")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("user_id", user.id)
            .eq("item_type", "LOST");


    if (!lostError) {

        lostCount.innerText = lostItems || 0;

    }


    // Get FOUND items count
    const { count: foundItems, error: foundError } =
        await supabase
            .from("items")
            .select("*", {
                count: "exact",
                head: true
            })
            .eq("user_id", user.id)
            .eq("item_type", "FOUND");


    if (!foundError) {

        foundCount.innerText = foundItems || 0;

    }

}


logoutBtn.addEventListener("click", logout);


// Start dashboard
const user = await requireLogin();

if (user) {
    await loadDashboard();
}