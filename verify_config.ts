
import { config } from './src/config/index';

console.log("Checking Loaded Config...");
console.log("GOOGLE_CLIENT_ID:", config.google.clientId ? "Set (" + config.google.clientId.substring(0, 5) + "...)" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", config.google.clientSecret ? "Set" : "MISSING");
console.log("GOOGLE_REDIRECT_URI:", config.google.redirectUri ? "Set" : "MISSING");
