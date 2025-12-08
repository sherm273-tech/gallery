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
            String url = String.format(
                    "%s?latitude=%s&longitude=%s&current_weather=true&timezone=Australia/Melbourne",
                    WEATHER_URL, LATITUDE, LONGITUDE
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Map<String, Object> current = (Map<String, Object>) response.get("current_weather");

            Map<String, Object> result = new HashMap<>();
            result.put("name", "Essendon");
            result.put("main", Map.of(
                    "temp", current.get("temperature"),
                    "feels_like", current.get("temperature"), // Open-Meteo does not provide apparent temp separately
                    "humidity", 0 // Open-Meteo current_weather does not provide humidity directly
            ));

            int weatherCode = ((Number) current.get("weathercode")).intValue();
            String[] weatherInfo = getWeatherFromCode(weatherCode);

            result.put("weather", List.of(Map.of(
                    "main", weatherInfo[0],
                    "description", weatherInfo[1],
                    "icon", weatherInfo[2]
            )));
            result.put("wind", Map.of("speed", current.get("windspeed")));

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

            LocalDate today = LocalDate.now();
            LocalDate endDate = today.plusDays(4); // 5-day forecast (Open-Meteo free tier limit)

            String url = String.format(
                    "%s?latitude=%s&longitude=%s&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Australia/Melbourne&start_date=%s&end_date=%s",
                    WEATHER_URL, LATITUDE, LONGITUDE, today, endDate
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Map<String, Object> hourly = (Map<String, Object>) response.get("hourly");

            List<String> times = (List<String>) hourly.get("time");
            List<Number> temps = (List<Number>) hourly.get("temperature_2m");
            List<Number> humidity = (List<Number>) hourly.get("relative_humidity_2m");
            List<Number> weatherCodes = (List<Number>) hourly.get("weather_code");
            List<Number> windSpeeds = (List<Number>) hourly.get("wind_speed_10m");

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

                forecastList.add(forecast);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("list", forecastList);
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
            // Open-Meteo returns format like "2025-12-11T20:00" without seconds/timezone
            // Need to append seconds and timezone for proper parsing
            String fullFormat = isoTime;
            if (!isoTime.contains("Z") && isoTime.length() == 16) {
                // Add seconds and Z timezone indicator
                fullFormat = isoTime + ":00Z";
            }
            long timestamp = java.time.Instant.parse(fullFormat).getEpochSecond();
            return timestamp;
        } catch (Exception e) {
            System.err.println("Failed to parse timestamp: " + isoTime + " - Error: " + e.getMessage());
            return System.currentTimeMillis() / 1000;
        }
    }
}
