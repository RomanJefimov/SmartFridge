document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");

    const loginBtn = document.querySelector('button[name="login"]');
    const tryBtn = document.querySelector('.try-btn');
    const closeBtn = document.querySelector(".close");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const goRegister = document.getElementById("go-register");
    const goLogin = document.getElementById("go-login");

    const registerBtn = document.querySelector("#register-form .submit-btn");
    const loginBtnSubmit = document.querySelector("#login-form .submit-btn");

    const errorBox = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");

    // Open modal
    function openModal() {
        modal.classList.add("active");
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    }

    // Close modal
    function closeModal() {
        modal.classList.remove("active");
    }

    if (loginBtn) loginBtn.addEventListener("click", openModal);
    if (tryBtn) tryBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    if (goRegister) {
        goRegister.addEventListener("click", () => {
            loginForm.classList.remove("active");
            registerForm.classList.add("active");
        });
    }

    if (goLogin) {
        goLogin.addEventListener("click", () => {
            registerForm.classList.remove("active");
            loginForm.classList.add("active");
        });
    }

    // Registration
    if (registerBtn) {
        registerBtn.addEventListener("click", async (event) => {
            event.preventDefault();

            registerError.textContent = "";

            const email = document.querySelector("#register-form input[type='email']").value.trim();
            const password = document.querySelectorAll("#register-form input[type='password']")[0].value;
            const repeatPassword = document.querySelectorAll("#register-form input[type='password']")[1].value;

            if (!email || !password || !repeatPassword) {
                registerError.textContent = "Fill in all fields";
                return;
            }

            if (password !== repeatPassword) {
                registerError.textContent = "Passwords do not match!";
                return;
            }

            try {
                const res = await fetch("/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    registerError.textContent = data.message || "Error";
                    return;
                }

                document.getElementById("register-form").reset();
                window.location.href = "/user/user.html";

            } catch (error) {
                registerError.textContent = "Server error";
            }
        });
    }

    // Login
    if (loginBtnSubmit) {
        loginBtnSubmit.addEventListener("click", async (event) => {
            event.preventDefault();

            errorBox.textContent = "";

            const email = document.querySelector("#login-form input[type='email']").value.trim();
            const password = document.querySelector("#login-form input[type='password']").value;

            if (!email || !password) {
                errorBox.textContent = "Fill in all fields";
                return;
            }

            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    errorBox.textContent = data.message || "Wrong credentials";
                    return;
                }

                localStorage.setItem("role", data.role);
                window.location.href = "/user/user.html";

            } catch (error) {
                errorBox.textContent = "Server error";
            }
        });
    }
});