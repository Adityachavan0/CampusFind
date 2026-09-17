import { supabase } from "./supabase.js";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.innerHTML = "Logging in...";
    message.className = "text-center mt-3 text-primary";

    try {

        // Login with Supabase Authentication
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Login failed.");
        }

        // Get user profile
        const { data: profile, error: profileError } =
            await supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();

        if (profileError) {
            throw profileError;
        }

        message.innerHTML = "Login successful!";
        message.className = "text-center mt-3 text-success";

        // Redirect according to role
        setTimeout(() => {

            if (profile.role === "admin") {

                window.location.href = "admin.html";

            } else {

                window.location.href = "dashboard.html";

            }

        }, 500);

    } catch (error) {

        console.error("Login Error:", error);

        message.innerHTML = error.message;
        message.className = "text-center mt-3 text-danger";
    }

});