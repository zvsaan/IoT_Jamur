let ws;
let suhuChart, kelembabanChart; // Referensi grafik

function connectWebSocket() {
    ws = new WebSocket('ws://10.2.1.139:81');
    ws.onopen = () => {
        console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
        const data = event.data;
        console.log("Received:", data);

        if (data.startsWith("TEMP:")) {
            const [tempStr, humStr] = data.split(",");
            const temp = parseFloat(tempStr.split(":")[1]);
            const hum = parseFloat(humStr.split(":")[1]);

            // Update tampilan
            document.getElementById("suhu-room").innerText = temp.toFixed(1) + " °C";
            document.getElementById("kelembaban").innerText = hum.toFixed(1) + " %";

            // Simpan nilai ke variabel global
            currentTempProgress = temp; // Simpan suhu asli
            currentHumProgress = hum; // Kelembapan maksimal 100%

            // Kirim data ke database
            saveToDatabase(temp, hum); // Kirim suhu dan kelembaban asli

            // Update grafik
            updateCharts(temp, hum);
        }

        // Update status pompa
        if (data.startsWith("RELAY:")) {
            const status = data.split(":")[1];
            document.getElementById("pompa-status").innerText = status;
            document.getElementById("pompa-status").style.color = status === "ON" ? "#4caf50" : "#f44336";

            // Jika mode manual, ubah status pompa sesuai dengan switch
            if (!document.getElementById("mode-toggle").checked) {
                document.getElementById("pompa-toggle").checked = status === "ON";
                document.getElementById("pompa-status-text").innerText = status === "ON" ? "Pompa ON" : "Pompa Off";
            }
        }
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected");
    };
}

// Fungsi untuk menyimpan data ke database
function saveToDatabase(temp, hum) {
    const data = {
        temperature: temp, // Gunakan suhu asli
        humidity: hum      // Gunakan kelembaban asli
    };

    console.log('Sending data to backend:', data); // Debugging

    fetch('http://localhost:3001/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response status:', response.status); // Debugging
        return response.json();
    })
    .then(result => {
        console.log('Data saved to database:', result); // Debugging
    })
    .catch(error => {
        console.error('Error saving data to database:', error); // Debugging
    });
}

// Fungsi untuk memperbarui grafik
function updateCharts(temp, hum) {
    const currentTime = new Date().toLocaleTimeString(); // Ambil waktu saat ini

    // Tambahkan data baru ke grafik suhu
    suhuChart.data.labels.push(currentTime);
    suhuChart.data.datasets[0].data.push(temp);
    suhuChart.update();

    // Tambahkan data baru ke grafik kelembaban
    kelembabanChart.data.labels.push(currentTime);
    kelembabanChart.data.datasets[0].data.push(hum);
    kelembabanChart.update();
}

// Fungsi untuk mengambil data dari server
function fetchData() {
    fetch('http://localhost:3001/get-data')
        .then(response => response.json())
        .then(data => {
            // Ambil data suhu dan kelembaban
            const temperatures = data.map(item => item.temperature);
            const humidities = data.map(item => item.humidity);
            const labels = data.map(item => new Date(item.created_at).toLocaleTimeString()); // Format waktu

            // Update grafik suhu
            suhuChart.data.labels = labels;
            suhuChart.data.datasets[0].data = temperatures;
            suhuChart.update();

            // Update grafik kelembaban
            kelembabanChart.data.labels = labels;
            kelembabanChart.data.datasets[0].data = humidities;
            kelembabanChart.update();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Inisialisasi grafik dengan Chart.js
window.onload = function () {
    connectWebSocket();
    fetchData(); // Ambil data saat halaman dimuat

    // Grafik Suhu
    const ctxSuhu = document.getElementById('suhu-chart').getContext('2d');
    suhuChart = new Chart(ctxSuhu, {
        type: 'line',
        data: {
            labels: [], // Label akan diisi saat data diterima
            datasets: [{
                label: 'Suhu (°C)',
                data: [], // Data akan diisi saat data diterima
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1
            }]
        }
    });

    // Grafik Kelembaban
    const ctxKelembaban = document.getElementById('kelembaban-chart').getContext('2d');
    kelembabanChart = new Chart(ctxKelembaban, {
        type: 'line',
        data: {
            labels: [], // Label akan diisi saat data diterima
            datasets: [{
                label: 'Kelembaban (%)',
                data: [], // Data akan diisi saat data diterima
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.1
            }]
        }
    });
};