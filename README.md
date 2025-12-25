To compress a video;

# Option 1: Using winget (Windows 10/11)
winget install ffmpeg

# Option 2: Using Chocolatey (if you have it)
choco install ffmpeg

# Option 3: Manual download
# Go to: https://www.gyan.dev/ffmpeg/builds/
# Download: ffmpeg-release-essentials.zip
# Extract and add to PATH

# Option 4 - to install in Raspberry pi
sudo apt update
sudo apt install ffmpeg -y


cd C:\gallery\europe
ffmpeg -i MVI_9317.MP4 -vf scale=1280:720 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k MVI_9317_compressed.MP4

cd C:\gallery
# Compress all MP4 videos in one batch
for /r %f in (*.MP4) do ffmpeg -i "%f" -vf scale=1280:720 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "%~dpnf_web.MP4"

=================================================================================================================================

