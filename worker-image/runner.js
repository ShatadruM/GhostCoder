const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = process.env.REPO_URL;
const USER_TASK = process.env.USER_TASK;
const BRANCH_NAME = process.env.BRANCH_NAME;

const WORKSPACE_DIR = path.join(__dirname, 'workspace');

function runCmd(command) {
    console.log(`\n> ${command}`);
    return execSync(command, { stdio: 'inherit' });
}

async function executePipeline() {
    try {
        console.log("\n--- STARTING CLONE PHASE ---");
        runCmd(`git config --global credential.helper store`);
        runCmd(`git config --global user.name "Ghost Coder [Bot]"`);
        runCmd(`git config --global user.email "bot@ghostcoder.local"`);
        
        const urlObj = new URL(REPO_URL);
        const authUrl = `https://${GITHUB_TOKEN}:x-oauth-basic@${urlObj.host}`;
        fs.writeFileSync(path.join(process.env.HOME || process.env.USERPROFILE, '.git-credentials'), `${authUrl}\n`, { mode: 0o600 });
        
        runCmd(`git clone ${REPO_URL} ${WORKSPACE_DIR}`);
        process.chdir(WORKSPACE_DIR);
        runCmd(`git checkout -b ${BRANCH_NAME}`);

        console.log("\n--- STARTING AGENT PHASE (AIDER) ---");
        
        // Remove quotes to prevent bash string breaking later
        const safeTask = USER_TASK.replace(/["']/g, "");
        fs.writeFileSync('prompt.txt', safeTask);
        
        runCmd(`aider --model gemini/gemini-2.5-flash --message-file prompt.txt --yes --no-auto-commits`);

        console.log("\n--- AGENT FINISHED. PUSHING BRANCH ---");
        
        // Push the edited code to the remote branch, but do NOT raise the PR yet
        runCmd(`git add .`);
        runCmd(`git commit -m "AI Fix: Automated Edit"`);
        runCmd(`git push origin ${BRANCH_NAME}`);

        console.log("\n✅ --- BRANCH PUSHED SUCCESSFULLY ---");

    } catch (error) {
        console.error("\n❌ Pipeline failed:", error.message);
        process.exit(1);
    }
}

executePipeline();