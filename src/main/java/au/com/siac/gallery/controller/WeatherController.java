package au.com.siac.gallery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

@Controller
public class WeatherController {

    // Open-Meteo API - NO API KEY REQUIRED!
    private static final String WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

    // Essendon coordinates
    private static final double LATITUDE = -37.7564;
    private static final double LONGITUDE = 144.9066;

    @GetMapping("/api/weather/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentWeather() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // Fetch current weather
            String url = String.format(
                    "%s?latitude=%s&longitude=%s&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=sunrise,sunset&timezone=Australia/Melbourne",
                    WEATHER_URL, LATITUDE, LONGITUDE
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Map<String, Object> current = (Map<String, Object>) response.get("current");
            Map<String, Object> daily = (Map<String, Object>) response.get("daily");

            Map<String, Object> result = new HashMap<>();
            result.put("name", "Essendon");
            
            Number temp = (Number) current.get("temperature_2m");
            Number humidity = (Number) current.get("relative_humidity_2m");
            Number feelsLike = (Number) current.get("apparent_temperature");
            Number uvIndex = (Number) current.get("uv_index");
            Number windDirection = (Number) current.get("wind_direction_10m");
            Number windSpeed = (Number) current.get("wind_speed_10m");
            
            result.put("main", Map.of(
                    "temp", temp != null ? temp : 0,
                    "feels_like", feelsLike != null ? feelsLike : temp,
                    "humidity", humidity != null ? humidity : 0
            ));

            int weatherCode = ((Number) current.get("weather_code")).intValue();
            String[] weatherInfo = getWeatherFromCode(weatherCode);

            result.put("weather", List.of(Map.of(
                    "main", weatherInfo[0],
                    "description", weatherInfo[1],
                    "icon", weatherInfo[2]
            )));
            
            result.put("wind", Map.of(
                    "speed", windSpeed != null ? windSpeed : 0,
                    "deg", windDirection != null ? windDirection : 0
            ));
            
            result.put("uv_index", uvIndex != null ? uvIndex : 0);
            
            // Add weather alerts based on conditions
            List<Map<String, String>> alerts = new ArrayList<>();
            
            // High UV alert
            if (uvIndex != null && uvIndex.doubleValue() >= 8) {
                alerts.add(Map.of(
                    "type", "UV",
                    "severity", "high",
                    "message", "Very High UV Index - Wear sunscreen and protective clothing"
                ));
            }
            
            // High wind alert
            if (windSpeed != null && windSpeed.doubleValue() > 50) {
                alerts.add(Map.of(
                    "type", "Wind",
                    "severity", "warning",
                    "message", String.format("Strong winds - Gusts up to %d km/h", Math.round(windSpeed.doubleValue() * 3.6))
                ));
            }
            
            // Extreme temperature alerts
            if (temp != null) {
                double tempC = temp.doubleValue();
                if (tempC >= 35) {
                    alerts.add(Map.of(
                        "type", "Heat",
                        "severity", "warning",
                        "message", "Extreme heat - Stay hydrated and avoid prolonged sun exposure"
                    ));
                } else if (tempC <= 5) {
                    alerts.add(Map.of(
                        "type", "Cold",
                        "severity", "advisory",
                        "message", "Very cold conditions - Dress warmly"
                    ));
                }
            }
            
            // Thunderstorm alert
            if (weatherCode >= 95 && weatherCode <= 99) {
                alerts.add(Map.of(
                    "type", "Thunderstorm",
                    "severity", "warning",
                    "message", "Thunderstorm activity - Seek shelter and avoid outdoor activities"
                ));
            }
            
            result.put("alerts", alerts);
            
            // Add sunrise and sunset
            if (daily != null) {
                List<String> sunriseList = (List<String>) daily.get("sunrise");
                List<String> sunsetList = (List<String>) daily.get("sunset");
                if (sunriseList != null && !sunriseList.isEmpty() && sunsetList != null && !sunsetList.isEmpty()) {
                    result.put("sys", Map.of(
                            "sunrise", parseTimestamp(sunriseList.get(0)),
                            "sunset", parseTimestamp(sunsetList.get(0))
                    ));
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch weather data: " + e.getMessage()));
        }
    }

    @GetMapping("/api/weather/forecast")
    @ResponseBody
    public ResponseEntity<?> getForecast() {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Use Melbourne timezone for date calculations
            java.time.ZoneId melbourneZone = java.time.ZoneId.of("Australia/Melbourne");
            LocalDate today = LocalDate.now(melbourneZone);
            LocalDate endDate = today.plusDays(4); // 5-day forecast (Open-Meteo free tier limit)

            String url = String.format(
                    "%s?latitude=%s&longitude=%s&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Australia/Melbourne&start_date=%s&end_date=%s",
                    WEATHER_URL, LATITUDE, LONGITUDE, today, endDate
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Map<String, Object> hourly = (Map<String, Object>) response.get("hourly");

            List<String> times = (List<String>) hourly.get("time");
            List<Number> temps = (List<Number>) hourly.get("temperature_2m");
            List<Number> humidity = (List<Number>) hourly.get("relative_humidity_2m");
            List<Number> weatherCodes = (List<Number>) hourly.get("weather_code");
            List<Number> windSpeeds = (List<Number>) hourly.get("wind_speed_10m");
            List<Number> precipProb = (List<Number>) hourly.get("precipitation_probability");
            List<Number> precipitation = (List<Number>) hourly.get("precipitation");
            List<Number> uvIndex = (List<Number>) hourly.get("uv_index");

            List<Map<String, Object>> forecastList = new ArrayList<>();

            for (int i = 0; i < times.size(); i++) {
                String[] weatherInfo = getWeatherFromCode(weatherCodes.get(i).intValue());

                Map<String, Object> forecast = new HashMap<>();
                forecast.put("dt", parseTimestamp(times.get(i)));
                forecast.put("main", Map.of(
                        "temp", temps.get(i),
                        "temp_min", temps.get(i),
                        "temp_max", temps.get(i),
                        "humidity", humidity.get(i)
                ));
                forecast.put("weather", List.of(Map.of(
                        "main", weatherInfo[0],
                        "description", weatherInfo[1],
                        "icon", weatherInfo[2]
                )));
                forecast.put("wind", Map.of("speed", windSpeeds.get(i)));
                
                // Add UV index
                if (uvIndex != null && i < uvIndex.size()) {
                    forecast.put("uv_index", uvIndex.get(i));
                } else {
                    forecast.put("uv_index", 0);
                }
                
                // Add precipitation data
                Map<String, Object> rain = new HashMap<>();
                if (precipitation != null && i < precipitation.size()) {
                    rain.put("3h", precipitation.get(i));
                }
                forecast.put("rain", rain);
                
                // Add precipitation probability
                if (precipProb != null && i < precipProb.size()) {
                    forecast.put("pop", precipProb.get(i));
                }

                forecastList.add(forecast);
            }

            // Add daily data for high/low temperatures
            Map<String, Object> dailyData = (Map<String, Object>) response.get("daily");
            List<Map<String, Object>> dailyList = new ArrayList<>();
            
            if (dailyData != null) {
                List<String> dailyTimes = (List<String>) dailyData.get("time");
                List<Number> dailyMaxTemps = (List<Number>) dailyData.get("temperature_2m_max");
                List<Number> dailyMinTemps = (List<Number>) dailyData.get("temperature_2m_min");
                List<Number> dailyWeatherCodes = (List<Number>) dailyData.get("weather_code");
                
                if (dailyTimes != null && dailyMaxTemps != null && dailyMinTemps != null) {
                    for (int i = 0; i < dailyTimes.size(); i++) {
                        String[] weatherInfo = getWeatherFromCode(dailyWeatherCodes.get(i).intValue());
                        
                        Map<String, Object> daily = new HashMap<>();
                        daily.put("dt", parseTimestamp(dailyTimes.get(i) + "T12:00"));
                        daily.put("temp", Map.of(
                                "max", dailyMaxTemps.get(i),
                                "min", dailyMinTemps.get(i)
                        ));
                        daily.put("weather", List.of(Map.of(
                                "main", weatherInfo[0],
                                "description", weatherInfo[1],
                                "icon", weatherInfo[2]
                        )));
                        dailyList.add(daily);
                    }
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("list", forecastList);
            result.put("daily", dailyList);
            result.put("city", Map.of("name", "Essendon"));

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch forecast data: " + e.getMessage()));
        }
    }

    // Convert WMO Weather Code to description and icon
    private String[] getWeatherFromCode(int code) {
        switch (code) {
            case 0: return new String[]{"Clear", "clear sky", "01d"};
            case 1: return new String[]{"Clear", "mainly clear", "02d"};
            case 2: return new String[]{"Clouds", "partly cloudy", "02d"};
            case 3: return new String[]{"Clouds", "overcast", "04d"};
            case 45: case 48: return new String[]{"Fog", "foggy", "50d"};
            case 51: case 53: case 55: return new String[]{"Drizzle", "drizzle", "09d"};
            case 61: return new String[]{"Rain", "light rain", "10d"};
            case 63: return new String[]{"Rain", "moderate rain", "10d"};
            case 65: return new String[]{"Rain", "heavy rain", "10d"};
            case 71: return new String[]{"Snow", "light snow", "13d"};
            case 73: return new String[]{"Snow", "moderate snow", "13d"};
            case 75: return new String[]{"Snow", "heavy snow", "13d"};
            case 80: case 81: case 82: return new String[]{"Rain", "rain showers", "09d"};
            case 95: return new String[]{"Thunderstorm", "thunderstorm", "11d"};
            case 96: case 99: return new String[]{"Thunderstorm", "thunderstorm with hail", "11d"};
            default: return new String[]{"Unknown", "unknown", "01d"};
        }
    }

    // Parse ISO 8601 timestamp to Unix timestamp
    private long parseTimestamp(String isoTime) {
        try {
            // Open-Meteo returns format like "2025-12-11T20:00" in the specified timezone (Australia/Melbourne)
            // We need to parse it as Melbourne time, NOT UTC
            java.time.ZoneId melbourneZone = java.time.ZoneId.of("Australia/Melbourne");
            
            // Parse as LocalDateTime first
            java.time.LocalDateTime localDateTime;
            if (isoTime.length() == 16) {
                // Format: "2025-12-11T20:00"
                localDateTime = java.time.LocalDateTime.parse(isoTime + ":00");
            } else {
                // Already has seconds
                localDateTime = java.time.LocalDateTime.parse(isoTime);
            }
            
            // Convert to ZonedDateTime using Melbourne timezone
            java.time.ZonedDateTime zonedDateTime = localDateTime.atZone(melbourneZone);
            
            // Get Unix timestamp
            long timestamp = zonedDateTime.toEpochSecond();
            return timestamp;
        } catch (Exception e) {
            System.err.println("Failed to parse timestamp: " + isoTime + " - Error: " + e.getMessage());
            return System.currentTimeMillis() / 1000;
        }
    }
}
