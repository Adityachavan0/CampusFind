import { supabase } from "./supabase.js";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.innerHTML = "Registering...";
    message.className = "mt-3 text-center text-primary";

    try {

        // Create user in Supabase Authentication
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("User was not created.");
        }

        // Store additional user information
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: data.user.id,
                full_name: fullName,
                student_id: studentId,
                email: email,
                role: "student",
                points: 0
            });

        if (profileError) {
            throw profileError;
        }

        message.innerHTML =
            "Registration successful! Check your email if confirmation is required.";

        message.className =
            "mt-3 text-center text-success";

        registerForm.reset();

    } catch (error) {

        console.error("Registration Error:", error);

        message.innerHTML = error.message;

        message.className =
            "mt-3 text-center text-danger";
    }

});