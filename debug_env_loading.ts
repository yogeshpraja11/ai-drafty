
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Current working directory:', process.cwd());
console.log('Expected .env path:', envPath);
console.log('File exists?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('--- .env content start ---');
    console.log(content);
    console.log('--- .env content end ---');
}

dotenv.config();
console.log('Loaded keys:', Object.keys(process.env).filter(k => k.startsWith('GOOGLE_')));
