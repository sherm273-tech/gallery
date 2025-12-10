package au.com.siac.gallery.controller;

import au.com.siac.gallery.entity.WeatherLocation;
import au.com.siac.gallery.service.WeatherLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

@Controller
public class WeatherController {

    // Open-Meteo API - NO API KEY REQUIRED!
    private static final String WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

    @Autowired
    private WeatherLocationService locationService;

    // ===== BACKWARDS COMPATIBLE ENDPOINTS (use default location) =====
    
    @GetMapping("/api/weather/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentWeather() {
        // Use default location for backwards compatibility
        Optional<WeatherLocation> defaultLocation = locationService.getDefaultLocation();
        if (defaultLocation.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "No default location set"));
        }
        
        WeatherLocation location = defaultLocation.get();
        return fetchCurrentWeather(
            location.getLatitude(), 
            location.getLongitude(), 
            location.getLocationName(),
            getTimezoneForLocation(location)
        );
    }

    @GetMapping("/api/weather/forecast")
    @ResponseBody
    public ResponseEntity<?> getForecast() {
        // Use default location for backwards compatibility
        Optional<WeatherLocation> defaultLocation = locationService.getDefaultLocation();
        if (defaultLocation.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "No default location set"));
        }
        
        WeatherLocation location = defaultLocation.get();
        return fetchForecast(
            location.getLatitude(), 
            location.getLongitude(), 
            location.getLocationName(),
            getTimezoneForLocation(location)
        );
    }

    // ===== NEW LOCATION-SPECIFIC ENDPOINTS =====
    
    @GetMapping("/api/weather/{locationId}/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentWeatherById(@PathVariable Long locationId) {
        Optional<WeatherLocation> locationOpt = locationService.getLocationById(locationId);
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Location not found"));
        }
        
        WeatherLocation location = locationOpt.get();
        return fetchCurrentWeather(
            location.getLatitude(), 
            location.getLongitude(), 
            location.getLocationName(),
            getTimezoneForLocation(location)
        );
    }

    @GetMapping("/api/weather/{locationId}/forecast")
    @ResponseBody
    public ResponseEntity<?> getForecastById(@PathVariable Long locationId) {
        Optional<WeatherLocation> locationOpt = locationService.getLocationById(locationId);
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Location not found"));
        }
        
        WeatherLocation location = locationOpt.get();
        return fetchForecast(
            location.getLatitude(), 
            location.getLongitude(), 
            location.getLocationName(),
            getTimezoneForLocation(location)
        );
    }

    // ===== HELPER: DETERMINE TIMEZONE FROM LOCATION =====
    
    private String getTimezoneForLocation(WeatherLocation location) {
        // TODO: Store timezone in database when location is created
        // For now, use simple heuristics based on location name
        String name = location.getLocationName().toLowerCase();
        
        // Asia - Southeast
        if (name.contains("bangkok") || name.contains("thailand")) {
            return "Asia/Bangkok";
        }
        if (name.contains("singapore")) {
            return "Asia/Singapore";
        }
        if (name.contains("hanoi") || name.contains("ho chi minh") || name.contains("vietnam")) {
            return "Asia/Ho_Chi_Minh";
        }
        if (name.contains("jakarta") || name.contains("indonesia")) {
            return "Asia/Jakarta";
        }
        if (name.contains("kuala lumpur") || name.contains("malaysia")) {
            return "Asia/Kuala_Lumpur";
        }
        if (name.contains("manila") || name.contains("philippines")) {
            return "Asia/Manila";
        }
        
        // Asia - East
        if (name.contains("tokyo") || name.contains("osaka") || name.contains("kyoto") || 
            name.contains("japan")) {
            return "Asia/Tokyo";
        }
        if (name.contains("seoul") || name.contains("korea")) {
            return "Asia/Seoul";
        }
        if (name.contains("taipei") || name.contains("taiwan")) {
            return "Asia/Taipei";
        }
        
        // Asia - China & Hong Kong
        if (name.contains("beijing") || name.contains("shanghai") || name.contains("china")) {
            return "Asia/Shanghai";
        }
        if (name.contains("hong kong")) {
            return "Asia/Hong_Kong";
        }
        
        // Asia - South
        if (name.contains("mumbai") || name.contains("delhi") || name.contains("bangalore") || 
            name.contains("chennai") || name.contains("india")) {
            return "Asia/Kolkata";
        }
        if (name.contains("dubai") || name.contains("uae")) {
            return "Asia/Dubai";
        }
        
        // USA
        if (name.contains("new york") || name.contains("boston") || name.contains("washington") ||
            name.contains("miami") || name.contains("philadelphia")) {
            return "America/New_York";
        }
        if (name.contains("los angeles") || name.contains("san francisco") || name.contains("seattle") ||
            name.contains("san diego") || name.contains("las vegas")) {
            return "America/Los_Angeles";
        }
        if (name.contains("chicago") || name.contains("houston") || name.contains("dallas") ||
            name.contains("austin")) {
            return "America/Chicago";
        }
        if (name.contains("denver") || name.contains("phoenix")) {
            return "America/Denver";
        }
        
        // UK & Ireland
        if (name.contains("london") || name.contains("manchester") || name.contains("birmingham") ||
            name.contains("uk") || name.contains("united kingdom") || name.contains("england")) {
            return "Europe/London";
        }
        if (name.contains("dublin") || name.contains("ireland")) {
            return "Europe/Dublin";
        }
        
        // Europe - Western
        if (name.contains("paris") || name.contains("france")) {
            return "Europe/Paris";
        }
        if (name.contains("berlin") || name.contains("munich") || name.contains("hamburg") ||
            name.contains("germany")) {
            return "Europe/Berlin";
        }
        if (name.contains("amsterdam") || name.contains("netherlands")) {
            return "Europe/Amsterdam";
        }
        if (name.contains("brussels") || name.contains("belgium")) {
            return "Europe/Brussels";
        }
        
        // Europe - Southern
        if (name.contains("rome") || name.contains("milan") || name.contains("italy")) {
            return "Europe/Rome";
        }
        if (name.contains("madrid") || name.contains("barcelona") || name.contains("spain")) {
            return "Europe/Madrid";
        }
        if (name.contains("lisbon") || name.contains("portugal")) {
            return "Europe/Lisbon";
        }
        if (name.contains("athens") || name.contains("greece")) {
            return "Europe/Athens";
        }
        
        // Europe - Eastern
        if (name.contains("moscow") || name.contains("russia")) {
            return "Europe/Moscow";
        }
        if (name.contains("istanbul") || name.contains("turkey")) {
            return "Europe/Istanbul";
        }
        
        // Australia & New Zealand
        if (name.contains("sydney") || name.contains("melbourne") || name.contains("brisbane") ||
            name.contains("adelaide") || name.contains("perth") || name.contains("australia")) {
            return "Australia/Melbourne";
        }
        if (name.contains("auckland") || name.contains("wellington") || name.contains("new zealand")) {
            return "Pacific/Auckland";
        }
        
        // Canada
        if (name.contains("toronto") || name.contains("montreal") || name.contains("ottawa")) {
            return "America/Toronto";
        }
        if (name.contains("vancouver") || name.contains("victoria")) {
            return "America/Vancouver";
        }
        
        // South America
        if (name.contains("sao paulo") || name.contains("rio") || name.contains("brazil")) {
            return "America/Sao_Paulo";
        }
        if (name.contains("buenos aires") || name.contains("argentina")) {
            return "America/Argentina/Buenos_Aires";
        }
        
        // Africa
        if (name.contains("cairo") || name.contains("egypt")) {
            return "Africa/Cairo";
        }
        if (name.contains("johannesburg") || name.contains("cape town") || name.contains("south africa")) {
            return "Africa/Johannesburg";
        }
        
        // Default to Australia/Melbourne
        return "Australia/Melbourne";
    }

    // ===== PRIVATE HELPER METHODS =====
    
    private ResponseEntity<?> fetchCurrentWeather(double latitude, double longitude, String locationName, String timezone) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // Fetch current weather using location's timezone
            String url = String.format(
                    "%s?latitude=%s&longitude=%s&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=sunrise,sunset&timezone=%s",
                    WEATHER_URL, latitude, longitude, timezone
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Map<String, Object> current = (Map<String, Object>) response.get("current");
            Map<String, Object> daily = (Map<String, Object>) response.get("daily");

            Map<String, Object> result = new HashMap<>();
            result.put("name", locationName);
            result.put("timezone", timezone); // ← ADDED TIMEZONE!
            
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
            
            // Add sunrise and sunset (now in location's timezone)
            if (daily != null) {
                List<String> sunriseList = (List<String>) daily.get("sunrise");
                List<String> sunsetList = (List<String>) daily.get("sunset");
                if (sunriseList != null && !sunriseList.isEmpty() && sunsetList != null && !sunsetList.isEmpty()) {
                    result.put("sys", Map.of(
                            "sunrise", parseTimestamp(sunriseList.get(0), timezone),
                            "sunset", parseTimestamp(sunsetList.get(0), timezone)
                    ));
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch weather data: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> fetchForecast(double latitude, double longitude, String locationName, String timezone) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Use location's timezone for date calculations
            java.time.ZoneId zoneId = java.time.ZoneId.of(timezone);
            LocalDate today = LocalDate.now(zoneId);
            LocalDate endDate = today.plusDays(4); // 5-day forecast (Open-Meteo free tier limit)

            String url = String.format(
                    "%s?latitude=%s&longitude=%s&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=%s&start_date=%s&end_date=%s",
                    WEATHER_URL, latitude, longitude, timezone, today, endDate
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
                forecast.put("dt", parseTimestamp(times.get(i), timezone));
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
                        daily.put("dt", parseTimestamp(dailyTimes.get(i) + "T12:00", timezone));
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
            result.put("city", Map.of("name", locationName));

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

    // Parse ISO 8601 timestamp to Unix timestamp using provided timezone
    private long parseTimestamp(String isoTime, String timezoneStr) {
        try {
            // Open-Meteo returns format like "2025-12-11T20:00" in the specified timezone
            java.time.ZoneId zoneId = java.time.ZoneId.of(timezoneStr);
            
            // Parse as LocalDateTime first
            java.time.LocalDateTime localDateTime;
            if (isoTime.length() == 16) {
                // Format: "2025-12-11T20:00"
                localDateTime = java.time.LocalDateTime.parse(isoTime + ":00");
            } else if (isoTime.length() == 10) {
                // Format: "2025-12-11" (date only)
                localDateTime = java.time.LocalDate.parse(isoTime).atStartOfDay();
            } else {
                // Already has seconds
                localDateTime = java.time.LocalDateTime.parse(isoTime);
            }
            
            // Convert to ZonedDateTime using the location's timezone
            java.time.ZonedDateTime zonedDateTime = localDateTime.atZone(zoneId);
            
            // Get Unix timestamp
            return zonedDateTime.toEpochSecond();
        } catch (Exception e) {
            System.err.println("Failed to parse timestamp: " + isoTime + " with timezone: " + timezoneStr + " - Error: " + e.getMessage());
            return System.currentTimeMillis() / 1000;
        }
    }
}