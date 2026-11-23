
const supabaseClient = window.supabaseClient;

// Get the currently logged-in user's profile.
async function getUserProfile(user) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Profile error:", error);
    }

    return data;
}

// Keep a profile snapshot for existing pages that still use currentUser.
// This is not used for authentication.
function saveCurrentUser(user, profile) {
    const loggedInUser = {
        id: user.id,
        firstName: profile?.first_name || user.user_metadata?.firstName || "",
        lastName: profile?.last_name || user.user_metadata?.lastName || "",
        email: user.email,
        studentNumber: profile?.student_number || user.user_metadata?.studentNumber || "",
        campus: profile?.campus || user.user_metadata?.campus || ""
    };

    localStorage.setItem("currentUser", JSON.stringify(loggedInUser));

    return loggedInUser;
}


// REGISTRATION

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const studentNumber = document.getElementById("studentNumber").value.trim();
        const campus = document.getElementById("campus").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        const message = document.getElementById("registerMessage");
        const submitButton = registerForm.querySelector('button[type="submit"]');

        message.hidden = false;

        if (password.length < 8) {
            message.textContent = "Password must be at least 8 characters.";
            return;
        }

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        firstName: firstName,
                        lastName: lastName,
                        studentNumber: studentNumber,
                        campus: campus
                    }
                }
            });

            if (error) {
                throw error;
            }

            registerForm.reset();

            if (data.session) {
                message.textContent = "Registration successful! You can now sign in.";
            } else {
                message.textContent =
                    "Registration successful! Please check your email for a confirmation link before signing in.";
            }

        } catch (error) {
            console.error("Registration error:", error);

            if (error.message.toLowerCase().includes("duplicate") ||
                error.message.toLowerCase().includes("unique")) {
                message.textContent =
                    "That student number may already be registered.";
            } else {
                message.textContent = error.message;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create account";
        }
    });
}


// LOGIN

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        const message = document.getElementById("loginMessage");
        const submitButton = loginForm.querySelector('button[type="submit"]');

        message.hidden = false;
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            const profile = await getUserProfile(data.user);

            saveCurrentUser(data.user, profile);

            window.location.href = "user-dashboard.html";

        } catch (error) {
            console.error("Login error:", error);
            message.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Sign in";
        }
    });
}


// CHECK LOGIN AND LOAD DASHBOARD

async function checkUserSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session error:", error);
    }

    const user = data.session?.user;

    const isDashboard = window.location.pathname.endsWith("user-dashboard.html");

    if (isDashboard && !user) {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
        return;
    }

    if (user) {
        const profile = await getUserProfile(user);
        const loggedInUser = saveCurrentUser(user, profile);

        const welcomeName = document.getElementById("welcomeName");
        const userAvatar = document.getElementById("userAvatar");

        if (welcomeName) {
            welcomeName.textContent = "Welcome back, " + loggedInUser.firstName + "!";
        }

        if (userAvatar) {
            userAvatar.textContent =
                loggedInUser.firstName.charAt(0).toUpperCase();
        }
    } else {
        localStorage.removeItem("currentUser");
    }
}

checkUserSession();


// LOGOUT

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", async function(event) {
        event.preventDefault();

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            alert("Unable to log out. Please try again.");
            return;
        }

        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    });
}
