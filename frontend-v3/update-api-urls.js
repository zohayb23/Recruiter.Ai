#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/pages/PipelineCRMPage.tsx',
  'src/pages/AutomationPage.tsx',
  'src/pages/SegmentationPage.tsx',
  'src/pages/ABTestingPage.tsx',
  'src/pages/MassMailingPage.tsx',
  'src/pages/GapAnalysisPage.tsx',
  'src/pages/DuplicateDetectionPage.tsx',
  'src/pages/JobListingsPage.tsx',
  'src/pages/ResumeParsingPage.tsx',
  'src/pages/JobDetailsPage.tsx',
  'src/pages/SemanticSearchPage.tsx'
];

// Update function
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace hardcoded localhost URLs with relative URLs
  content = content.replace(/http:\/\/localhost:8804/g, '');
  
  fs.writeFileSync(fullPath, content);
  console.log(`Updated: ${filePath}`);
}

// Update all files
console.log('Updating API URLs to use relative paths...');
filesToUpdate.forEach(updateFile);
console.log('Done! All API URLs updated to use relative paths for Netlify deployment.');
