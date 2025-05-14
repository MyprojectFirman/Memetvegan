const tbody = document.querySelector("#tabel tbody");
let data = JSON.parse(localStorage.getItem("data")) || [];

function formatTanggal(tanggal) {
  const [year, month, day] = tanggal.split("-");
  return `${day}/${month}/${year}`;
}

function simpanKeStorage() {
  localStorage.setItem("data", JSON.stringify(data));
}

function tambahData() {
  const referensi = document.getElementById("referensi").value;
  const tanggal = document.getElementById("tanggal").value;
  const jumlah = parseInt(document.getElementById("jumlah").value) || 0;

  if (!referensi || !tanggal || jumlah === 0) {
    alert("Harap isi semua data dengan benar!");
    return;
  }

  data.push({ id: Date.now(), referensi, tanggal, jumlah });
  simpanKeStorage();
  renderTabel();

  document.getElementById("referensi").value = "";
  document.getElementById("tanggal").value = "";
  document.getElementById("jumlah").value = "";
}

function hapusData(id) {
  data = data.filter(item => item.id !== id);
  simpanKeStorage();
  renderTabel();
}

function hapusSemua() {
  if (confirm("Yakin ingin menghapus semua data?")) {
    data = [];
    simpanKeStorage();
    renderTabel();
  }
}

function renderTabel() {
  tbody.innerHTML = "";
  const grouped = {};

  data.forEach(item => {
    if (!grouped[item.tanggal]) grouped[item.tanggal] = [];
    grouped[item.tanggal].push(item);
  });

  let grandTotal = 0;

  Object.keys(grouped)
    .sort()
    .forEach(tgl => {
      const items = grouped[tgl];
      const subtotal = items.reduce((sum, x) => sum + x.jumlah, 0);
      grandTotal += subtotal;

      const dateRow = document.createElement("tr");
      dateRow.classList.add("date-row");
      const tdDate = document.createElement("td");
      tdDate.colSpan = 4;
      tdDate.textContent = `Tanggal: ${formatTanggal(tgl)}`;
      dateRow.appendChild(tdDate);
      tbody.appendChild(dateRow);

      items.forEach((item, index) => {
        const tr = document.createElement("tr");

        if (index === 0) {
          const tdTanggal = document.createElement("td");
          tdTanggal.rowSpan = items.length;
          tdTanggal.textContent = formatTanggal(tgl);
          tr.appendChild(tdTanggal);
        }

        const tdReferensi = document.createElement("td");
        tdReferensi.textContent = item.referensi;
        tr.appendChild(tdReferensi);

        const tdJumlah = document.createElement("td");
        tdJumlah.textContent = `Rp ${item.jumlah.toLocaleString("id-ID")}`;
        tr.appendChild(tdJumlah);

        if (index === 0) {
          const tdSubtotal = document.createElement("td");
          tdSubtotal.rowSpan = items.length;
          tdSubtotal.textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
          tr.appendChild(tdSubtotal);
        }

        const tdAksi = document.createElement("td");
        tdAksi.classList.add("no-print");
        const btnDelete = document.createElement("button");
        btnDelete.className = "hapus-btn";
        btnDelete.innerHTML = "&#128465;";
        btnDelete.onclick = () => hapusData(item.id);
        tdAksi.appendChild(btnDelete);
        tr.appendChild(tdAksi);

        tbody.appendChild(tr);
      });
    });

  const totalRow = document.createElement("tr");
  totalRow.classList.add("total-row");

  const tdKosong = document.createElement("td");
  tdKosong.colSpan = 1;
  
  const tdKosong2 = document.createElement("td");
  const tdLabel = document.createElement("td");
  tdLabel.textContent = "Total Keseluruhan";
  const tdTotal = document.createElement("td");
  tdTotal.textContent = `Rp ${grandTotal.toLocaleString("id-ID")}`;
  const tdEmpty = document.createElement("td");
  tdEmpty.classList.add("no-print");

  totalRow.appendChild(tdKosong);
  totalRow.appendChild(tdKosong2);
  totalRow.appendChild(tdLabel);
  totalRow.appendChild(tdTotal);
  totalRow.appendChild(tdEmpty);

  tbody.appendChild(totalRow);
}

renderTabel();

async function generatePDF() {
  document.getElementById("progress").style.display = "block";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pdfWidth = doc.internal.pageSize.getWidth();

  const logoUrl = "1.png";
  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  logoImg.src = logoUrl;

  logoImg.onload = async () => {
    doc.setGState(new doc.GState({ opacity: 0.07 }));
    doc.addImage(logoImg, 'PNG', (pdfWidth - 400) / 2, 200, 400, 400);
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Sembunyikan kolom aksi sebelum render PDF
    document.querySelectorAll(".no-print").forEach(el => el.style.display = "none");

    const element = document.getElementById("exportArea");
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfTableHeight = (imgProps.height * (pdfWidth - 80)) / imgProps.width;

    doc.addImage(imgData, 'PNG', 40, 70, pdfWidth - 80, pdfTableHeight);
    doc.save("data-management.pdf");

    // Tampilkan kembali elemen aksi
    document.querySelectorAll(".no-print").forEach(el => el.style.display = "inline-block");

    document.getElementById("progress").style.display = "none";
  };

  logoImg.onerror = () => {
    alert("Gagal memuat watermark logo.");
    document.getElementById("progress").style.display = "none";
  };
}
