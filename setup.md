# Kiosk Display Setup

## 1. Get Weather API Key
1. Go to https://openweathermap.org/api
2. Sign up (free)
3. Copy your API key
4. Paste it into index.html where it says WEATHER_API_KEY

## 2. Get Google Calendar ICS URL
1. Go to https://calendar.google.com/calendar/r/settings
2. Click your calendar on the left
3. Scroll to "Integrate calendar"
4. Copy "Secret address in iCal format" URL
5. Paste it into index.html where it says calendarIcsUrl

## 3. Install on Phone via ADB
```bash
# Push files to phone
adb push index.html /sdcard/kiosk/index.html

# Install Fully Kiosk Browser (or use Chrome)
# Set URL to: file:///sdcard/kiosk/index.html
```

## 4. Auto-start on Boot
- Fully Kiosk Browser has built-in kiosk mode + auto-start
- Or use Tasker to launch Chrome on boot
