import { supabase } from "./supabase.js";


// =====================================================
// GET CURRENT USER
// =====================================================

export async function getCurrentUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return user;
}


// =====================================================
// REQUIRE LOGIN
// =====================================================

export async function requireLogin() {

    const user = await getCurrentUser();

    if (!user) {

        window.location.href = "login.html";

        return null;
    }

    return user;
}


// =====================================================
// REQUIRE ADMIN
// =====================================================

export async function requireAdmin() {

    const user = await requireLogin();

    if (!user) {
        return null;
    }


    const { data: profile, error } =
        await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();


    if (error || !profile) {

        console.error(error);

        await supabase.auth.signOut();

        window.location.href = "login.html";

        return null;
    }


    if (profile.role !== "admin") {

        alert("Admin access required.");

        window.location.href = "dashboard.html";

        return null;
    }


    return user;
}


// =====================================================
// LOGOUT
// =====================================================

export async function logout() {

    const { error } =
        await supabase.auth.signOut();

    if (error) {

        alert(error.message);

        return;
    }

    window.location.href = "login.html";
}