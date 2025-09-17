cat > src/lib/figmentParser.js <<'EOF'
// src/lib/figmentParser.js
// Bridge: route old imports to the canonical OCR library.
export {
  parseMetrics,
  sanitizeParsedMetrics,
  initialAdvancedInputs
} from './ocr';
EOF
