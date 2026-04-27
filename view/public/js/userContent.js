document.addEventListener("DOMContentLoaded", () => {
    const content = document.querySelector(".content");
    const menuItems = document.querySelectorAll(".menu-item");

    function setActive(element) {
        menuItems.forEach(item => item.classList.remove("active"));
        element.classList.add("active");
    }

    // Function to show upload content
    function showUploadContent() {
        content.innerHTML = `
            <h1>Fridge is empty</h1>
            <button class="btn">
                Upload picture 
                <img src="/view/public/images/upload_icon.svg" alt="Upload icon">
            </button>
        `;
    }

    // Add click event listeners to menu items
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            setActive(item);

            const text = item.textContent.trim();

            switch (text) {
                case "Upload Picture":
                    showUploadContent();
                    break;

                case "List of products":
                    content.innerHTML = `
                        <h1>List of products</h1>
                        <p>Here will be your fridge products.</p>
                    `;
                    break;

                case "Recipes":
                    content.innerHTML = `
                        <h1>Recipes</h1>
                        <p>Here will be recipes based on products.</p>
                    `;
                    break;

                case "History":
                    content.innerHTML = `
                        <h1>History</h1>
                        <p>Upload history will be shown here.</p>
                    `;
                    break;

                case "Personal characteristics":
                    content.innerHTML = `
                        <h1>Personal characteristics</h1>
                        <p>User personal information.</p>
                    `;
                    break;

                case "Analysis":
                    content.innerHTML = `
                        <h1>Analysis</h1>
                        <p>Nutrition analysis will be here.</p>
                    `;
                    break;
            }
        });
    });
});