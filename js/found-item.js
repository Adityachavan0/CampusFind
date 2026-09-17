import { supabase } from "./supabase.js";

const form = document.getElementById("foundItemForm");
const message = document.getElementById("message");


// ================= LOAD CATEGORIES =================

async function loadCategories() {

    const { data, error } = await supabase
        .from("categories")
        .select("id, category_name")
        .order("category_name");

    if (error) {

        console.error("Category Error:", error);
        return;
    }

    const categorySelect =
        document.getElementById("category");

    data.forEach(category => {

        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.category_name;

        categorySelect.appendChild(option);

    });
}


// ================= LOAD LOCATIONS =================

async function loadLocations() {

    const { data, error } = await supabase
        .from("locations")
        .select("id, location_name")
        .order("location_name");

    if (error) {

        console.error("Location Error:", error);
        return;
    }

    const locationSelect =
        document.getElementById("location");

    data.forEach(location => {

        const option = document.createElement("option");

        option.value = location.id;
        option.textContent = location.location_name;

        locationSelect.appendChild(option);

    });
}


// ================= SET TODAY =================

document.getElementById("itemDate").value =
    new Date().toISOString().split("T")[0];


// ================= SUBMIT FORM =================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    message.innerHTML = "Submitting...";
    message.className =
        "text-center mt-3 text-primary";

    try {

        // Get logged-in user

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {

            window.location.href = "login.html";
            return;
        }


        // Get values

        const itemName =
            document.getElementById("itemName").value.trim();

        const categoryId =
            document.getElementById("category").value;

        const description =
            document.getElementById("description").value.trim();

        const locationId =
            document.getElementById("location").value;

        const itemDate =
            document.getElementById("itemDate").value;

        const itemTime =
            document.getElementById("itemTime").value || null;

        const imageFile =
            document.getElementById("itemImage").files[0];


        // ================= IMAGE UPLOAD =================

        let imageUrl = null;

        if (imageFile) {

            if (!imageFile.type.startsWith("image/")) {
                throw new Error("Please select a valid image.");
            }

            // Limit image size to 5 MB
            if (imageFile.size > 5 * 1024 * 1024) {
                throw new Error("Image must be less than 5 MB.");
            }


            const extension =
                imageFile.name.split(".").pop().toLowerCase();

            const fileName =
                `${user.id}/${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2)}.${extension}`;


            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("item-images")
                    .upload(fileName, imageFile, {
                        contentType: imageFile.type,
                        upsert: false
                    });


            if (uploadError) {
                throw uploadError;
            }


            console.log("Uploaded:", uploadData);


            // Get public URL

            const { data: publicUrlData } =
                supabase.storage
                    .from("item-images")
                    .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;


            console.log("Image URL:", imageUrl);
        }


        // ================= INSERT INTO ITEMS =================

        const { data: itemData, error: itemError } =
            await supabase
                .from("items")
                .insert({

                    user_id: user.id,

                    item_type: "FOUND",

                    item_name: itemName,

                    category_id: categoryId,

                    description: description,

                    image_url: imageUrl,

                    location_id: locationId,

                    item_date: itemDate,

                    item_time: itemTime,

                    status: "ACTIVE",

                    approval_status: "PENDING"

                })
                .select()
                .single();


        if (itemError) {
            throw itemError;
        }


        console.log("Saved item:", itemData);


        // ================= SUCCESS =================

        message.innerHTML =
            "✅ Found item submitted successfully! Waiting for admin approval.";

        message.className =
            "text-center mt-3 text-success";

        form.reset();

        document.getElementById("itemDate").value =
            new Date().toISOString().split("T")[0];


    } catch (error) {

        console.error("Found Item Error:", error);

        message.innerHTML =
            "❌ " + error.message;

        message.className =
            "text-center mt-3 text-danger";
    }

});


// Load data
loadCategories();
loadLocations();