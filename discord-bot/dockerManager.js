const Docker = require('dockerode');
const docker = new Docker();

/**
 * Spawns the worker container to edit and push the branch.
 */
async function spawnWorkerAndPush(githubToken, repoUrl, userTask) {
    const branchName = `ghost-coder-fix-${Date.now()}`;
    
    console.log(`Spawning Docker container...`);
    const container = await docker.createContainer({
        Image: 'openclaw-poc:latest',
        Env: [
            `GITHUB_TOKEN=${githubToken}`,
            `REPO_URL=${repoUrl}`,
            `USER_TASK=${userTask}`,
            `GEMINI_API_KEY=${process.env.GEMINI_API_KEY}`,
            `BRANCH_NAME=${branchName}`
        ],
        HostConfig: {
            AutoRemove: true, // Auto-deletes when finished
            Memory: 1024 * 1024 * 1024
        }
    });

    await container.start();
    const logStream = await container.logs({ follow: true, stdout: true, stderr: true });
    logStream.pipe(process.stdout);
    
    // Wait for container to finish its process naturally
    const statusCode = await new Promise((resolve) => {
        container.wait((err, data) => {
            resolve(data ? data.StatusCode : 1);
        });
    });

    if (statusCode !== 0) {
        throw new Error("Container pipeline failed.");
    }

    return branchName;
}

/**
 * Uses the GitHub REST API to raise the PR (No local CLI required).
 */
async function createPullRequest(githubToken, owner, repo, branchName, userTask) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: "Ghost Coder Automated Fix",
            body: `Generated via Discord Bot.\nTask: ${userTask}`,
            head: branchName,
            base: "main" // Adjust to 'master' if your repo uses master
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`GitHub API Error: ${errData.message}`);
    }
    
    return await response.json();
}

/**
 * Uses the GitHub REST API to delete the rejected branch.
 */
async function deleteBranch(githubToken, owner, repo, branchName) {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`;
    await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
}

module.exports = { spawnWorkerAndPush, createPullRequest, deleteBranch };