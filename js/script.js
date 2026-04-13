document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");

    const loginBtn = document.querySelector('button[name="login"]');
    const tryBtn = document.querySelector('.try-btn');
    const closeBtn = document.querySelector(".close");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const goRegister = document.getElementById("go-register");
    const goLogin = document.getElementById("go-login");

    // открыть модалку (всегда сначала login)
    function openModal() {
        modal.classList.add("active");

        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    }

    // закрыть модалку
    function closeModal() {
        modal.classList.remove("active");
    }

    // открыть с кнопок
    if (loginBtn) loginBtn.addEventListener("click", openModal);
    if (tryBtn) tryBtn.addEventListener("click", openModal);

    // закрыть по крестику
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // закрыть по клику вне окна
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // переключение: login → register
    if (goRegister) {
        goRegister.addEventListener("click", () => {
            loginForm.classList.remove("active");
            registerForm.classList.add("active");
        });
    }

    // переключение: register → login
    if (goLogin) {
        goLogin.addEventListener("click", () => {
            registerForm.classList.remove("active");
            loginForm.classList.add("active");
        });
    }
});