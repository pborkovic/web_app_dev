const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

if (process.argv.length !== 4) {
    console.error('Verwendung: node script.js FOLDER HASH');
    console.error('Hash needs to be MD5 or SHA256');
    process.exit(1);
}

const FOLDER = process.argv[2];
const HASH_TYPE = process.argv[3];

if (!['md5', 'sha256'].includes(HASH_TYPE)) {
    console.error('Hash needs to be MD5 or SHA256');
    process.exit(1);
}

/**
 * calculates a hash value from a file
 * @param {string} filePath - path to file
 * @returns {Promise<string>} hash val of file
 */
function calculateHash(filePath) {
    return new Promise((resolve, reject) => {
        const command = HASH_TYPE === 'md5' ? 'md5sum' : 'sha256sum';
        const hashProcess = spawn(command, [filePath]);
        let output = '';

        hashProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        hashProcess.stderr.on('data', (data) => {
            console.error(`Fehler bei ${filePath}: ${data}`);
        });
        hashProcess.on('close', (code) => {
            if (code === 0) {
                const hash = output.split(' ')[0]; // get only the first row
                resolve(hash);
            } else {
                reject(new Error(`Process ends with Code ${code}`));
            }
        });
    });
}

/**
 * loops a dir recursevely
 * @param {string} dir - directory
 * @returns {Promise<string[]>} array with all files
 */
async function getAllFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return getAllFiles(fullPath);
            } else {
                return fullPath;
            }
        })
    );
    return files.flat();
}

async function main() {
    try {
        await fs.access(FOLDER);
        const files = await getAllFiles(FOLDER);

        for (const file of files) {
            try {
                const hash = await calculateHash(file);
                console.log(`${hash}  ${file}`);
            } catch (error) {
                console.error(`Fehler bei der Verarbeitung von ${file}: ${error.message}`);
            }
        }
    } catch (error) {
        console.error(`Fehler beim Zugriff auf den Ordner ${FOLDER}: ${error.message}`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Ein unerwarteter Fehler ist aufgetreten:', error);
    process.exit(1);
});
