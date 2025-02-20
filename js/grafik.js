let ws;

function connectWebSocket() {
    ws = new WebSocket('ws:990d-103-162-221-250.ngrok-free.app');
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
            document.getElementById("suhu-room").innerText = temp.toFixed(1) + " °C";
            document.getElementById("kelembaban").innerText = hum.toFixed(1) + " %";
            updateProgress(temp, hum);
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

document.getElementById("mode-toggle").addEventListener("change", function () {
    const mode = this.checked ? "MODE:MANUAL" : "MODE:AUTO";
    ws.send(mode);
    document.getElementById("mode-status-text").innerText = this.checked ? "Mode: Manual" : "Mode: Otomatis";

    const pompaToggle = document.getElementById("pompa-toggle");
    if (this.checked) {
        pompaToggle.disabled = false;
        document.getElementById("pompa-status-text").innerText = pompaToggle.checked ? "Pompa ON" : "Pompa Off";
    } else {
        pompaToggle.disabled = true;
        pompaToggle.checked = false;
        document.getElementById("pompa-status-text").innerText = "Pompa Off";
    }
});

document.getElementById("pompa-toggle").addEventListener("change", function () {
    const state = this.checked ? "RELAY:ON" : "RELAY:OFF";
    ws.send(state);
});

function updateProgress(temp, hum) {
    const tempProgress = (temp / 50) * 100; // Asumsi suhu maksimal 50°C
    const humProgress = hum; // Kelembapan maksimal 100%
    document.getElementById("temp-progress").style.width = tempProgress + "%";
    document.getElementById("hum-progress").style.width = humProgress + "%";
}

// Inisialisasi grafik dengan Chart.js
window.onload = function () {
    connectWebSocket();

    // Grafik Suhu
    const ctxSuhu = document.getElementById('suhu-chart').getContext('2d');
    const suhuChart = new Chart(ctxSuhu, {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6'],
            datasets: [{
                label: 'Suhu (°C)',
                data: [27, 28, 29, 30, 31, 32, 33],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1
            }]
        }
    });

    // Grafik Kelembaban
    const ctxKelembaban = document.getElementById('kelembaban-chart').getContext('2d');
    const kelembabanChart = new Chart(ctxKelembaban, {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6'],
            datasets: [{
                label: 'Kelembaban (%)',
                data: [85, 86, 87, 88, 89, 90, 91],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.1
            }]
        }
    });
};