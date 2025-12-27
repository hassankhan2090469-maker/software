/***********************
  GLOBAL STATE
************************/
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let invoice   = JSON.parse(localStorage.getItem("invoice")) || [];

let editInventoryIndex = -1;
let editInvoiceIndex   = -1;

/***********************
  INVENTORY ELEMENTS
************************/
const itemName   = document.getElementById("itemName");
const categoryEl = document.getElementById("category");
const qtyEl      = document.getElementById("qty");
const buyEl      = document.getElementById("buy");
const sellEl     = document.getElementById("sell");
const inventoryTableBody = document.getElementById("inventoryTableBody");

/***********************
  INVOICE ELEMENTS
************************/
const invoiceTableBody = document.getElementById("invoiceTableBody");
const grandTotalEl    = document.getElementById("grandTotal");

/***********************
  INVENTORY FUNCTIONS
************************/
function saveItem() {
  let item = {
    name: itemName.value.trim(),
    category: categoryEl.value.trim(),
    qty: Number(qtyEl.value),
    buy: Number(buyEl.value),
    sell: Number(sellEl.value)
  };

  if (!item.name || !item.category || item.qty <= 0 || item.buy <= 0 || item.sell <= 0) {
    alert("Fill all fields");
    return;
  }

  if (editInventoryIndex === -1) {
    inventory.push(item);            // ADD
  } else {
    inventory[editInventoryIndex] = item; // EDIT
    editInventoryIndex = -1;
  }

  saveAll();
  clearItemInputs();
  renderInventory();
  renderInvoiceItemDropdown();
}

function renderInventory() {
  inventoryTableBody.innerHTML = "";
  inventory.forEach((item, i) => {
    inventoryTableBody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.qty}</td>
        <td>${item.buy}</td>
        <td>${item.sell}</td>
        <td>
          <button onclick="editInventory(${i})">Edit</button>
          <button onclick="deleteInventory(${i})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function editInventory(index) {
  let item = inventory[index];
  itemName.value = item.name;
  categoryEl.value = item.category;
  qtyEl.value = item.qty;
  buyEl.value = item.buy;
  sellEl.value = item.sell;
  editInventoryIndex = index;
}

function deleteInventory(index) {
  inventory.splice(index, 1);
  saveAll();
  renderInventory();
  renderInvoiceItemDropdown();
}

function clearItemInputs() {
  itemName.value = "";
  categoryEl.value = "";
  qtyEl.value = "";
  buyEl.value = "";
  sellEl.value = "";
}

/***********************
  INVOICE FUNCTIONS
************************/
function addToInvoice() {
  let invIndex = document.getElementById("invoiceItem").value;
  let qty = Number(document.getElementById("invoiceQty").value);

  if (invIndex === "" || qty <= 0) {
    alert("Select item & quantity");
    return;
  }

  let stockItem = inventory[invIndex];

  // agar EDIT mode hai to pehli qty wapas stock me daal do
  if (editInvoiceIndex !== -1) {
    let old = invoice[editInvoiceIndex];
    let oldStock = inventory.find(i => i.name === old.name);
    if (oldStock) oldStock.qty += old.qty;
  }

  if (qty > stockItem.qty) {
    alert("Not enough stock");
    return;
  }

  stockItem.qty -= qty;

  let invoiceItem = {
    name: stockItem.name,
    category: stockItem.category,
    qty: qty,
    sell: stockItem.sell
  };

  if (editInvoiceIndex === -1) {
    invoice.push(invoiceItem);      // ADD
  } else {
    invoice[editInvoiceIndex] = invoiceItem; // EDIT
    editInvoiceIndex = -1;
  }

  saveAll();
  renderInventory();
  renderInvoice();

  document.getElementById("invoiceQty").value = "";
}

function renderInvoice() {
  invoiceTableBody.innerHTML = "";
  invoice.forEach((item, i) => {
    invoiceTableBody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.qty}</td>
        <td>${item.sell}</td>
        <td>${item.qty * item.sell}</td>
        <td>
          <button onclick="editInvoice(${i})">Edit</button>
          <button onclick="deleteInvoice(${i})">Delete</button>
        </td>
      </tr>
    `;
  });
  calculateTotal();
}

function editInvoice(index) {
  let item = invoice[index];
  document.getElementById("invoiceItem").value =
    inventory.findIndex(i => i.name === item.name);
  document.getElementById("invoiceCategory").value = item.category;
  document.getElementById("invoiceQty").value = item.qty;
  document.getElementById("invoiceSellPrice").value = item.sell;
  editInvoiceIndex = index;
}

function deleteInvoice(index) {
  let item = invoice[index];
  let stockItem = inventory.find(i => i.name === item.name);
  if (stockItem) stockItem.qty += item.qty;

  invoice.splice(index, 1);
  saveAll();
  renderInventory();
  renderInvoice();
}

function calculateTotal() {
  let total = 0;
  invoice.forEach(i => total += i.qty * i.sell);
  grandTotalEl.innerText = total.toFixed(2);
}

/***********************
  PDF (ORIGINAL SIMPLE – SAFE)
************************/
function printInvoice() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let cname = document.getElementById("customerName").value || "N/A";
  let phone = document.getElementById("customerPhone").value || "N/A";
  let date  = new Date().toLocaleDateString();

  // ===== TITLE =====
  doc.setFontSize(18);
  doc.text("INVOICE", 105, 15, { align: "center" });

  // ===== CUSTOMER INFO =====
  doc.setFontSize(11);
  doc.text(`Customer: ${cname}`, 14, 30);
  doc.text(`Phone: ${phone}`, 14, 38);
  doc.text(`Date: ${date}`, 150, 30);

  // ===== TABLE DATA =====
  let tableData = invoice.map(item => ([
    item.name,
    item.category,
    item.qty,
    item.sell,
    item.qty * item.sell
  ]));

  // ===== TABLE (GREEN HEADER) =====
  doc.autoTable({
    startY: 50,
    head: [["Item", "Category", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 10,
      halign: "center"
    },
    headStyles: {
      fillColor: [46, 204, 113], // ✅ green header (like pic)
      textColor: 255
    },
    columnStyles: {
      0: { halign: "left" }
    }
  });

  // ===== GRAND TOTAL =====
  let finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Grand Total: ${grandTotalEl.innerText}`, 150, finalY);

  // ===== SAVE =====
  doc.save("invoice.pdf");

  // ===== CLEAR =====
  if (confirm("Invoice printed successfully. Start new invoice?")) {
    clearInvoice();
  }
}

function clearInvoice() {
  invoice = [];
  localStorage.removeItem("invoice");
  invoiceTableBody.innerHTML = "";
  grandTotalEl.innerText = "0";
  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
}

/***********************
  HELPERS
************************/
function saveAll() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("invoice", JSON.stringify(invoice));
}

/***********************
  INIT
************************/
renderInventory();
renderInvoice();
renderInvoiceItemDropdown();

function renderInvoiceItemDropdown() {
  const dropdown = document.getElementById("invoiceItem");
  dropdown.innerHTML = `<option value="">Select Item</option>`;
  inventory.forEach((item, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = item.name;
    dropdown.appendChild(opt);
  });
}

document.getElementById("invoiceItem").addEventListener("change", function () {
  let index = this.value;
  if (index === "") {
    document.getElementById("invoiceCategory").value = "";
    document.getElementById("invoiceSellPrice").value = "";
    return;
  }
  document.getElementById("invoiceCategory").value = inventory[index].category;
  document.getElementById("invoiceSellPrice").value = inventory[index].sell;
});
