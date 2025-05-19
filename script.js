document.getElementById("filter").addEventListener("change", filterList);

function addItem() {
    let input = document.getElementById("newItem");
    let itemText = input.value.trim();
    if (itemText === "") return;
    
    let li = document.createElement("li");
    li.innerHTML = `
        <span>${itemText}</span>
        <span class="cart-icon" onclick="toggleStatus(this)">🛒</span>
        <button onclick="deleteItem(this)">🗑️</button>
    `;
    document.getElementById("shoppingList").appendChild(li);
    input.value = "";
}

function deleteItem(button) {
    if (confirm("Tem certeza que deseja excluir este item?")) {
        button.parentElement.remove();
    }
}

function toggleStatus(icon) {
    if (icon.classList.contains("red")) {
        icon.classList.remove("red");
        icon.classList.add("green");
    } else if (icon.classList.contains("green")) {
        icon.classList.remove("green");
    } else {
        icon.classList.add("red");
    }
}

function filterList() {
    let filterValue = document.getElementById("filter").value;
    let items = document.querySelectorAll("#shoppingList li");
    
    items.forEach(item => {
        let icon = item.querySelector(".cart-icon");
        item.style.display = "block";

        if (filterValue === "to-buy" && !icon.classList.contains("red")) {
            item.style.display = "none";
        } else if (filterValue === "unpurchased" && (icon.classList.contains("red") || icon.classList.contains("green"))) {
            item.style.display = "none";
        }
    });
}

function backupList() {
    localStorage.setItem("shoppingBackup", document.getElementById("shoppingList").innerHTML);
    alert("Backup realizado!");
}

function recoverBackup() {
    let backup = localStorage.getItem("shoppingBackup");
    if (backup) {
        document.getElementById("shoppingList").innerHTML = backup;
    } else {
        alert("Nenhum backup encontrado!");
    }
}