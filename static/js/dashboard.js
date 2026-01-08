let yearChart;
let mouseChart;
let chart;
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

        yearChart = new Chart(ctx, {
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
            const amountsDiscovered = Array(12).fill(0);

            // Заполняем массивы значениями
            for (const item of data[0]) {
                amounts[item.month - 1] = item.amount; // Добавляем количество пойманных мышей
            }

            for (const item of data[1]) {
                amountsDiscovered[item.month - 1] = item.amountDiscovered; // Добавляем количество пойманных мышей
            }

            // Создание графика
            const ctx = document.getElementById('mouseChart').getContext('2d');
            mouseChart = new Chart(ctx, {
                type: 'bar', // Тип графика (можно 'line', 'bar', 'pie' и т.д.)
                data: {
                    labels: labels, // Метки по оси x
                    datasets: [{
                        label: 'Количество пойманных млекопитающих',
                        data: amounts, // Данные для графика
                        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Цвет заливки
                        borderColor: 'rgba(75, 192, 192, 1)', // Цвет линии
                        borderWidth: 1
                    },
                    {
                        label: 'Количество исследованных млекопитающих',
                        data: amountsDiscovered, // Данные для графика
                        backgroundColor: 'rgba(75, 160, 160, 1)', // Цвет заливки
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

            if(yearChart){
                yearChart.destroy();
            }
            if(mouseChart)
            {
                mouseChart.destroy();
            }
            if(chart)
            {
                chart.destroy();
            }
        drawChart(year);
        miceGraph(year);
        drawMap(year);
        drawBar(year);
        drawHeatMap(year);
    }




const monthOrder = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
     const monthNames = {
            january: 'Январь',
            february: 'Февраль',
            march: 'Март',
            april: 'Апрель',
            may: 'Май',
            june: 'Июнь',
            july: 'Июль',
            august: 'Август',
            september: 'Сентябрь',
            october: 'Октябрь',
            november: 'Ноябрь',
            december: 'Декабрь'
        };

     const partNames = {
            0: '1-я неделя',
            1: '2-я неделя',
            2: '3-я неделя',
            3: '4-я неделя'
        };



function drawHeatMap(year)
{
    $.ajax ({
        type: 'GET',
        url: '/getHeatData/' + year,
        success: function(answer)
        {
            if (answer == "no_data")
            {
                return;
            }

            data = answer;
            const seriesData = [];

            Object.values(partNames).forEach((partName, partIndex) => {
                const weekData = {
                    name: partName,
                    data: []
                };

                monthOrder.forEach(month => {
                    weekData.data.push({
                        x: monthNames[month],
                        y: (data[partIndex] || {})[month] || 0
                    });
                });

                seriesData.push(weekData);
            });


                const options = {
                series: seriesData,
                chart: {
                    height: 500,
                    type: 'heatmap',
                    toolbar: {
                        show: true,
                        tools: {
                            download: true,
                            selection: false,
                            zoom: false,
                            zoomin: true,
                            zoomout: true,
                            pan: false,
                            reset: true
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    horizontalAlign: 'center',
                    fontSize: '14px',
                    itemMargin: {
                        horizontal: 10,
                        vertical: 5
                    }
                },
                dataLabels: {
                    enabled: true,
                    style: {
                        fontSize: '12px',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold'
                    },
                    formatter: function(val) {
                        return val > 0 ? val : '';
                    }
                },
                colors: ["#F3F4F6", "#BFDBFE", "#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A"],
                xaxis: {
                    type: 'category',
                    categories: Object.values(monthNames), // Месяцы по горизонтали
                    labels: {
                        style: {
                            fontSize: '13px',
                            fontWeight: 600
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            fontSize: '13px',
                            fontWeight: 600
                        }
                    }
                },
                plotOptions: {
                    heatmap: {
                        radius: 4,
                        enableShades: true,
                        shadeIntensity: 0.5,
                        reverseNegativeShade: true,
                        distributed: false,
                        colorScale: {
                            ranges: [
                                { from: 0, to: 0, color: "#F3F4F6", name: "Нет данных" },
                                { from: 1, to: 5, color: "#BFDBFE", name: "Мало" },
                                { from: 6, to: 10, color: "#93C5FD", name: "Умеренно" },
                                { from: 11, to: 15, color: "#60A5FA", name: "Средне" },
                                { from: 16, to: 20, color: "#3B82F6", name: "Выше среднего" },
                                { from: 21, to: 25, color: "#2563EB", name: "Много" },
                                { from: 26, to: 30, color: "#1D4ED8", name: "Очень много" },
                                { from: 31, to: 35, color: "#1E40AF", name: "Пик" },
                                { from: 36, to: 100, color: "#1E3A8A", name: "Максимум" }
                            ]
                        }
                    }
                },

                grid: {
                    borderColor: '#f1f1f1',
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                },
                responsive: [{
                    breakpoint: 768,
                    options: {
                        chart: {
                            height: 400
                        },
                        dataLabels: {
                            fontSize: '10px'
                        }
                    }
                }]
            };

            chart = new ApexCharts(document.querySelector("#chart"), options);
            chart.render();
            calculateStatistics();
        }
    })
}



 function calculateStatistics() {
            let total = 0;
            let max = 0;
            const monthTotals = {};

            // Инициализация сумм по месяцам
            monthOrder.forEach(month => {
                monthTotals[month] = 0;
            });

            // Суммирование всех данных
            data.forEach(weekData => {
                monthOrder.forEach(month => {
                    const value = weekData[month] || 0;
                    total += value;
                    monthTotals[month] += value;
                    if (value > max) max = value;
                });
            });

            // Находим самый активный месяц
            let maxMonth = '';
            let maxMonthValue = 0;

            monthOrder.forEach(month => {
                if (monthTotals[month] > maxMonthValue) {
                    maxMonthValue = monthTotals[month];
                    maxMonth = month;
                }
            });

            return {
                total,
                max,
                activeMonth: maxMonth ? monthNames[maxMonth] : '-',
                activeMonthValue: maxMonthValue
            };
        }

