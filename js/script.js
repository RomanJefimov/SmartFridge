document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");

    const loginBtn = document.querySelector('button[name="login"]');
    const tryBtn = document.querySelector('.try-btn');
    const closeBtn = document.querySelector(".close");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const goRegister = document.getElementById("go-register");
    const goLogin = document.getElementById("go-login");

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
});