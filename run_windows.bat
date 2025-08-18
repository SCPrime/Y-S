@echo off
REM Generate the ROI model preview HTML and open it in the default browser.
node generate_preview.js
start "" "%~dp0preview.html"
