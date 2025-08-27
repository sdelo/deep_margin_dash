#!/usr/bin/env node

/**
 * Script to export dashboard data from API to static JSON file
 * Usage: node scripts/export-data.js [api-url] [output-path]
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_API_URL = 'http://localhost:9008';
const DEFAULT_OUTPUT_PATH = 'public/data/dashboard-data.json';

async function exportData(apiUrl = DEFAULT_API_URL, outputPath = DEFAULT_OUTPUT_PATH) {
    try {
        console.log(`Exporting data from ${apiUrl}...`);
        
        // Fetch all data endpoints
        const [managers, loans, liquidations] = await Promise.all([
            fetch(`${apiUrl}/margin_managers`).then(r => r.json()),
            fetch(`${apiUrl}/margin_loans`).then(r => r.json()),
            fetch(`${apiUrl}/margin_liquidations`).then(r => r.json())
        ]);
        
        const dashboardData = {
            managers,
            loans,
            liquidations,
            exportedAt: new Date().toISOString(),
            exportedFrom: apiUrl
        };
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write data to file
        fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));
        
        console.log(`✅ Data exported successfully to ${outputPath}`);
        console.log(`📊 Exported ${managers.length} managers, ${loans.length} loans, ${liquidations.length} liquidations`);
        
    } catch (error) {
        console.error('❌ Failed to export data:', error.message);
        process.exit(1);
    }
}

// Get command line arguments
const [,, apiUrl, outputPath] = process.argv;

// Run export
exportData(apiUrl, outputPath);
