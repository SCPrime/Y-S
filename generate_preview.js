const fs = require('fs');
const vm = require('vm');

// Load the Apps Script file and evaluate it in a sandbox.
const code = fs.readFileSync('roi_model_appscript.gs', 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

// Use the _buildHtml_ function from the Apps Script to generate HTML
const html = sandbox._buildHtml_('all', {
  totalValue: 24113,
  netPrincipal: 20000,
  carry: 20
});

fs.writeFileSync('preview.html', html);
console.log('Generated preview.html using _buildHtml_ from roi_model_appscript.gs');
