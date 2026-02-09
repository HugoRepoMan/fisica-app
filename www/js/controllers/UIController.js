window.UIController = {

    showAlert(message, type = "is-danger") {
        const container = document.getElementById("alert-container");
        container.innerHTML = `
            <div class="notification ${type}">
                ${message}
            </div>
        `;
        setTimeout(() => container.innerHTML = "", 3000);
    }
};
