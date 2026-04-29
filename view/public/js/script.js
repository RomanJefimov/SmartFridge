document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");

    const loginBtn = document.querySelector('button[name="login"]');
    const tryBtn = document.querySelector('.try-btn');
    const closeBtn = document.querySelector(".close");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const goRegister = document.getElementById("go-register");
    const goLogin = document.getElementById("go-login");

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
    
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        registerError.textContent = "";

        const email = registerForm.querySelector("input[type='email']").value.trim();
        const password = registerForm.querySelectorAll("input[type='password']")[0].value;
        const repeatPassword = registerForm.querySelectorAll("input[type='password']")[1].value;

        if (!email || !password || !repeatPassword) {
            registerError.textContent = "Fill in all fields";
            return;
        }

        if (password !== repeatPassword) {
            registerError.textContent = "Passwords do not match!";
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                registerError.textContent = data.message || "Error";
                return;
            }

            window.location.href = "/user";

        } catch (error) {
            console.error(error);
            registerError.textContent = "Server error";
        }
    });

    
    // Login
    
        loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        errorBox.textContent = "";
        
        const email = loginForm.querySelector("input[type='email']").value.trim();
        const password = loginForm.querySelector("input[type='password']").value;
        
        if (!email || !password) {
            errorBox.textContent = "Fill in all fields";
            return;
        }
    
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
        
            const data = await res.json().catch(() => ({}));
        
            if (!res.ok) {
                errorBox.textContent = data.message || "Wrong credentials";
                return;
            }
        
            localStorage.setItem('token', data.token); // 👈 добавил
            localStorage.setItem('role', data.role);
            localStorage.setItem('email', data.email);
            window.location.href = "/user";
        
        } catch (error) {
            console.error(error);
            errorBox.textContent = "Server error";
        }
    });
});