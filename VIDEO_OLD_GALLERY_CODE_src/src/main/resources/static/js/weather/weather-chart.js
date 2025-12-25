// ===== WEATHER CHART MODULE =====
// Handles temperature/rain/UV chart using Chart.js

const WeatherChart = (() => {
    // ===== PRIVATE VARIABLES =====
    let chartInstance = null;
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Create the initial chart
     */
    function createChart() {
        const canvas = document.getElementById('precipitationChart');
        if (!canvas) {
            console.error('❌ precipitationChart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Rain Chance',
                        data: [],
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        yAxisID: 'y-rain',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Temperature',
                        data: [],
                        borderColor: '#FF5722',
                        backgroundColor: 'rgba(255, 87, 34, 0.1)',
                        yAxisID: 'y-temp',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'UV Index',
                        data: [],
                        borderColor: '#FFC107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        yAxisID: 'y-uv',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (context.dataset.label === 'Rain Chance') {
                                        label += context.parsed.y + '%';
                                    } else if (context.dataset.label === 'Temperature') {
                                        label += context.parsed.y + '°C';
                                    } else if (context.dataset.label === 'UV Index') {
                                        label += context.parsed.y;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    'y-rain': {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#2196F3',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Rain %',
                            color: '#2196F3'
                        }
                    },
                    'y-temp': {
                        type: 'linear',
                        position: 'right',
                        ticks: {
                            color: '#FF5722',
                            callback: function(value) {
                                return value + '°';
                            }
                        },
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Temp °C',
                            color: '#FF5722'
                        }
                    },
                    'y-uv': {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 11,
                        ticks: {
                            color: '#FFC107'
                        },
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'UV',
                            color: '#FFC107'
                        }
                    }
                }
            }
        });
        
        console.log('✅ Weather chart created');
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize the weather chart
     */
    function init() {
        createChart();
        console.log('✅ Weather Chart module initialized');
    }
    
    /**
     * Update chart with new data
     * @param {Array} hourlyData - Hourly forecast data
     */
    function update(hourlyData) {
        if (!chartInstance) {
            console.warn('⚠️ Chart not initialized, creating now...');
            createChart();
            if (!chartInstance) return;
        }
        
        console.log('📊 Updating temperature chart with', hourlyData.length, 'data points');
        
        // Filter to future hours only
        const futureHours = WeatherUtils.filterFutureHours(hourlyData);
        
        // Take next 8 data points (24 hours if hourly, or 24 hours if 3-hourly)
        const chartData = futureHours.slice(0, 8);
        
        const timezone = WeatherAPI.getTimezone();
        
        // Extract data for chart
        const labels = chartData.map(hour => {
            const time = new Date(hour.dt * 1000);
            return time.toLocaleString('en-AU', { 
                hour: 'numeric',
                hour12: true,
                timeZone: timezone
            });
        });
        
        const temps = chartData.map(hour => Math.round(hour.main.temp));
        const rainProb = chartData.map(hour => Math.round((hour.pop || 0) * 100));
        const uvData = chartData.map(hour => hour.uv_index || 0);
        
        // Update chart data
        chartInstance.data.labels = labels;
        
        if (chartInstance.data.datasets[0]) {
            chartInstance.data.datasets[0].data = rainProb;
        }
        
        if (chartInstance.data.datasets[1]) {
            chartInstance.data.datasets[1].data = temps;
        }
        
        if (chartInstance.data.datasets[2]) {
            chartInstance.data.datasets[2].data = uvData;
        }
        
        chartInstance.update();
        console.log('✅ Chart updated - Rain, Temperature, UV');
    }
    
    /**
     * Destroy the chart
     */
    function destroy() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
            console.log('🗑️ Chart destroyed');
        }
    }
    
    /**
     * Get chart instance
     * @returns {Chart|null} Chart instance
     */
    function getChart() {
        return chartInstance;
    }
    
    // Return public API
    return {
        init,
        update,
        destroy,
        getChart
    };
})();

console.log('✅ Weather Chart module loaded');
