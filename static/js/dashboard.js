let chart;
let mouseChart;
let mapBool = false;

async function fetchDiseaseData(year) {
    const response = await fetch(`/getDiseases/${year}`);
    const data = await response.json();
    return data;
}

    function calculatePercentages(data) {
        const total = data.reduce((sum, entry) => sum + entry.disease_amount, 0);
        return data.map(entry => ((entry.disease_amount / total) * 100).toFixed(2));
    }

    async function drawChart(year) {
        document.getElementById("preloader").classList.remove('hidden');
        const diseaseData = await fetchDiseaseData(year);

        const diseases = diseaseData.map(entry => entry.disease);
        const counts = diseaseData.map(entry => entry.disease_amount);
        const percentages = calculatePercentages(diseaseData);

        const ctx = document.getElementById('diseaseChart').getContext('2d');

        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: diseases,
                datasets: [{
                    label: 'Процент от общего числа',
                    data: percentages,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(201, 203, 207, 0.6)',
                        'rgba(0, 255, 0, 0.6)',
                    ],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Распределение обнаруженных заболеваний'
                    }
                }
            }
        });
        document.getElementById("preloader").classList.add('hidden');
    }

    function miceGraph(year) {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];

    fetch(`/caughtMiceInYear/${year}`) // Замените на соответствующий маршрут вашего метода
        .then(response => response.json())
        .then(data => {
            const labels = monthNames;
            const amounts = Array(12).fill(0);

            // Заполняем массивы значениями
            for (const item of data) {
                //labels.push(monthNames[item.month - 1]); // Добавляем номер месяца
                amounts[item.month - 1] = item.amount; // Добавляем количество пойманных мышей
            }

            // Создание графика
            const ctx = document.getElementById('mouseChart').getContext('2d');
            mouseChart = new Chart(ctx, {
                type: 'bar', // Тип графика (можно 'line', 'bar', 'pie' и т.д.)
                data: {
                    labels: labels, // Метки по оси x
                    datasets: [{
                        label: 'Количество пойманных мышей',
                        data: amounts, // Данные для графика
                        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Цвет заливки
                        borderColor: 'rgba(75, 192, 192, 1)', // Цвет линии
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Ошибка при получении данных:', error));
    }

    function drawMap(year)
    {
        if (mapBool) {
            map.remove(); // Удаляем карту
            const div = document.createElement('div');
            const target = document.getElementById('mapTarget');
            div.id = 'map';
            div.className = 'map';
            target.insertAdjacentElement('beforebegin', div)
        }
        let diseasesData = [];
        $.ajax({
                    type: 'GET',
                    url: '/diseaseMap/' + year,
                    success: function(answer)
                    {
                        mapBool = true;
                        diseasesData = answer;
                        let map = L.map('map').setView([56.52656, 84.97625], 9);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                maxZoom: 19,
                            }).addTo(map);

                        diseasesData.forEach(function(data) {
                            const radius = 200;
                            L.circle([data.Coords_Y, data.Coords_X], {
                            color: getColor(data.disease),
                            radius: radius
                            }).addTo(map)
                            .bindPopup(data.disease + "\nКоличество: " + data.amount);
                        });
                        document.getElementById('yearSelect').disabled = false;
                    }
                });
    }

    $(document).ready(() => {
        updateDash();
    });

    function updateDash()
    {
        const yearSelect = document.getElementById('yearSelect');
        const year = yearSelect.value;
        yearSelect.disabled = true;

            if(chart){
                chart.destroy();
            }
            if(mouseChart)
            {
                mouseChart.destroy();
            }
        drawChart(year);
        miceGraph(year);
        drawMap(year);

    }

function getColor(disease) {
    const colors = {
        "Заболевание 1": "red",
        "Заболевание 2": "blue",
        "Заболевание 3": "green",
        "Заболевание 4": "yellow",
        "Заболевание 5": "brown",
        "Заболевание 6": "purple",
    };
    return colors[disease] || "grey";
}