oth iconst jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bGV3Y3dha2lheXpqcHN3enh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTkwNDIsImV4cCI6MjA5NzUzNTA0Mn0.qxj-IZLm4bwBxj-w0P6907UkrnJNu_Xmy47-iNMR0-M';
const payload = jwt.split('.')[1];
const decoded = Buffer.from(payload, 'base64').toString('utf8');
console.log('Decoded Anon Key Payload:', decoded);
