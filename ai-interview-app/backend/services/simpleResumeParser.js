import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple Resume Parser - No AI, just extraction
 * Uses Python pdfplumber for PDF text extraction
 * Extracts contact, skills, and bio using regex
 */
class SimpleResumeParser {

  /**
   * Extract and parse resume
   * @param {String} fileBase64 - Base64 encoded file content
   * @param {String} fileType - File extension (pdf, docx)
   * @returns {Promise<Object>} Parsed resume data
   */
  static async parseResume(fileBase64, fileType) {
    return new Promise((resolve, reject) => {
      try {
        console.log('📄 Starting simple resume parsing...');
        console.log(`   File type: ${fileType}`);

        const scriptPath = path.join(__dirname, '../python/extract_resume.py');
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        
        const python = spawn(pythonCommand, [scriptPath]);
        
        let output = '';
        let errorOutput = '';
        
        python.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        python.on('close', (code) => {
          try {
            if (code !== 0) {
              console.error('❌ Python extraction failed');
              console.error('   Error:', errorOutput);
              return reject(new Error('Python extraction failed: ' + errorOutput));
            }
            
            const result = JSON.parse(output);
            
            if (result.success) {
              console.log('✅ Resume parsed successfully');
              console.log(`   Name: ${result.contact.name || 'Not found'}`);
              console.log(`   Email: ${result.contact.email || 'Not found'}`);
              console.log(`   Skills: ${result.skills.length} found`);
              console.log(`   Bio length: ${result.bio.length} chars`);
              resolve(result);
            } else {
              console.error('❌ Parsing failed:', result.error);
              reject(new Error(result.error));
            }
            
          } catch (e) {
            console.error('❌ Failed to parse output:', e.message);
            reject(new Error(`Failed to parse result: ${e.message}`));
          }
        });
        
        python.on('error', (err) => {
          console.error('❌ Failed to start Python:', err.message);
          if (err.code === 'ENOENT') {
            reject(new Error('Python is not installed or not in PATH'));
          } else {
            reject(new Error(`Python error: ${err.message}`));
          }
        });
        
        const input = JSON.stringify({
          fileBase64,
          fileType
        });
        
        python.stdin.write(input);
        python.stdin.end();
        
      } catch (err) {
        console.error('❌ Parser error:', err);
        reject(err);
      }
    });
  }
}

export default SimpleResumeParser;
