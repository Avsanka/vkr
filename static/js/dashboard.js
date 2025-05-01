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
        const data = await fetchDiseaseData(year);
        const diseaseData = data.filter(item => item.disease !== 'Не обнаружено').filter(item => item.disease !== 'Не исследовано');

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

                        const pops = Object.values(diseasesData.reduce((acc, {Coords_X, Coords_Y, amount, disease}) => {
                            const key = `${Coords_X},${Coords_Y}`;
                            if (!acc[key]) {
                                acc[key] = {};
                            }
                            acc[key][disease] = (acc[key][disease] || 0) + amount;
                            return acc;
                        }, {})).map(obj => {
                            return Object.entries(obj).map(([disease, amount]) => `${disease}: ${amount}`).join(', ');
                        });

                        cx = diseasesData[0].Coords_X;
                        cy = diseasesData[0].Coords_Y;

                        diseasesData.forEach(function(data) {
                            if(cx != data.Coords_X || cy != data.Coords_Y)
                            {
                                pops.shift();
                            }
                            const radius = 300;
                            L.circle([data.Coords_Y, data.Coords_X], {
                            color: "Red",
                            radius: radius
                            }).addTo(map)
                            .bindPopup(pops[0]);
                            cx = data.Coords_X;
                            cy = data.Coords_Y;
                        });
                        document.getElementById('yearSelect').disabled = false;
                    }
                });
    }

    function clearBars() {
    const barContainer = document.querySelector('.bar-container');
    while (barContainer.firstChild) {
        barContainer.removeChild(barContainer.firstChild);
    }
}

    function drawBar(year)
    {
        $.ajax({
            type: 'GET',
            url: '/miceGenderStats/' + year,
            success: function(answer)
            {
                const data = answer;
                const females = data[0][0].fem;
                const males = data[1][0].male;

                const total = females + males;

                const femPercentage = ((females / total) * 100).toFixed(2);
                const malePercentage = ((males / total) * 100).toFixed(2);

                document.getElementById('fem-count').innerText = females;
                document.getElementById('male-count').innerText = males;
                document.getElementById('fem-percentage').innerText = femPercentage + '%';
                document.getElementById('male-percentage').innerText = malePercentage + '%';
                clearBars();

                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.width = femPercentage + '%';

                document.querySelector('.bar-container').appendChild(bar);

                const barMale = document.createElement('div');
                barMale.className = 'bar bar-male';
                barMale.style.width = malePercentage + '%';

                barMale.style.position = 'absolute';
                barMale.style.left = femPercentage + '%';

                document.querySelector('.bar-container').appendChild(barMale);
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
        drawBar(year);
    }

//function getColor(disease) {
//    const colors = {
//        "ГАЧ": "Red",
//        "Грипп А": "Blue",
//        "Иерсиниоз": "Green",
//        "ИКБ": "Yellow",
//        "Лептоспироз": "Orange",
//        "ЛЗН": "Purple",
//        "Листериоз": "Pink",
//        "МЭЧ": "Brown",
//        "Орнитоз": "Cyan",
//        "Псевдо и иерсиниоз": "Magenta",
//        "Псевдотуберкулез": "Teal",
//        "Туляремия": "Indigo",
//        "Хантавирусы": "Black"
//    };
//    return colors[disease] || "Red";
//}

