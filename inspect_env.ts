
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

try {
    if (!fs.existsSync(envPath)) {
        console.log("ERROR: .env file not found at " + envPath);
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');

    console.log(`Analyzing .env (${lines.length} lines)...`);

    const keysToCheck = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
    const foundKeys: Record<string, boolean> = {};

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // Check for common issues
        if (trimmed.includes(' =')) {
            const parts = trimmed.split('=');
            if (keysToCheck.includes(parts[0].trim())) {
                console.log(`WARNING: Line ${index + 1} has spaces around '=': "${parts[0]} = ..." (This might cause issues)`);
            }
        }

        keysToCheck.forEach(key => {
            if (trimmed.startsWith(key)) {
                foundKeys[key] = true;
                const parts = trimmed.split('=');
                if (parts.length < 2 || !parts[1].trim()) {
                    console.log(`ERROR: ${key} on line ${index + 1} has no value`);
                } else {
                    console.log(`OK: ${key} found.`);
                    // Check for remaining prompts
                    if (parts[1].includes('your_client_id_here')) {
                        console.log(`ERROR: ${key} still has placeholder value "your_client_id_here"`);
                    }
                }
            }
        });
    });

    keysToCheck.forEach(key => {
        if (!foundKeys[key]) {
            console.log(`ERROR: ${key} not found in .env`);
        }
    });

} catch (err: any) {
    console.error("Failed to read .env:", err.message);
}
