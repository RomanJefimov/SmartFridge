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

    // open modal
    function openModal() {
        modal.classList.add("active");

        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    }

    // close modal
    function closeModal() {
        modal.classList.remove("active");
    }

    // open modal by buttons
    if (loginBtn) loginBtn.addEventListener("click", openModal);
    if (tryBtn) tryBtn.addEventListener("click", openModal);

    // close by close button
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // close by clicking outside
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // switch: login - register
    if (goRegister) {
        goRegister.addEventListener("click", () => {
            loginForm.classList.remove("active");
            registerForm.classList.add("active");
        });
    }

    // switch: register - login
    if (goLogin) {
        goLogin.addEventListener("click", () => {
            registerForm.classList.remove("active");
            loginForm.classList.add("active");
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener("click", async (event) => {
            event.preventDefault();

            registerError.textContent = "";

            const email = document.querySelector("#register-form input[type='email']").value;
            const password = document.querySelectorAll("#register-form input[type='password']")[0].value;
            const repeatPassword = document.querySelectorAll("#register-form input[type='password']")[1].value;

            // password match validation
            if (password !== repeatPassword) {
                registerError.textContent = "Passwords do not match!";
                return;
            }

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

            window.location.href = "/user.html";
        });
    }

    if (loginBtnSubmit) {
        loginBtnSubmit.addEventListener("click", async (event) => {
            event.preventDefault();

            errorBox.textContent = "";

            const email = document.querySelector("#login-form input[type='email']").value;
            const password = document.querySelector("#login-form input[type='password']").value;

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

            if (data.role === "admin") {
            window.location.href = "admin/admin.html";
            } else if (data.role === "user") {
                window.location.href = "user/user.html";
            }
        });
    }
});