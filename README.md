# Discovibe

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-ISC-blue)
![Node Version](https://img.shields.io/badge/node-22.x-brightgreen)

**An AI-powered Discord bot that autonomously generates code and submits pull requests to GitHub repositories.**

Ghost Coder bridges AI and collaborative development by allowing you to assign coding tasks through Discord, complete with live preview and approval workflows. Powered by **Gemini AI** and **Aider**, it transforms natural language requirements into complete, tested code implementations.

---

## 🎯 Features

- **🤖 Autonomous Code Generation**: Describe your coding task in Discord; Ghost Coder handles the implementation
- **🔄 Full Git Workflow**: Automatic repository cloning, branching, coding, and push to GitHub
- **👀 Live Preview**: StackBlitz integration for instant browser-based code preview
- **✅ Review & Approve**: Interactive Discord buttons to approve or reject generated code before PR submission
- **🔐 Secure Token Handling**: GitHub tokens stored in-memory and never logged
- **🐳 Containerized Execution**: Isolated Docker workers prevent system interference
- **📝 Automated PR Creation**: Intelligent pull requests with meaningful descriptions

---

## 🏗️ Architecture

Ghost Coder operates as a **two-tier system**:

### 1. **Discord Bot** (`discord-bot/`)
- **Language**: JavaScript (Node.js 22)
- **Role**: UI layer and orchestration
- **Responsibilities**:
  - Accepts user commands via Discord messaging
  - Manages state machine for multi-step user workflows
  - Spawns containerized worker processes
  - Creates pull requests on GitHub
  - Provides interactive approval/rejection interface

### 2. **Worker Image** (`worker-image/`)
- **Language**: JavaScript (Node.js 22) + Python
- **Role**: Headless code execution engine
- **Responsibilities**:
  - Clones GitHub repositories
  - Configures git authentication
  - Executes **Aider** CLI for AI-driven code generation
  - Commits changes with meaningful messages
  - Pushes branch back to GitHub

### 3. **LLM Integration**
- **AI Model**: Google Gemini 2.5 Flash
- **Framework**: Aider Chat (AI-assisted coding tool)
- **Temperature**: 0.1 (deterministic, focused outputs)
- **Headless Mode**: Operates without user interaction

---

## 🔄 Workflow Diagram

```
1. User sends !init in Discord
        ↓
2. Provides GitHub PAT (Personal Access Token)
        ↓
3. Specifies target repository URL
        ↓
4. Describes coding task
        ↓
5. Bot spawns Docker worker container
        ↓
6. Worker clones repo, creates branch
        ↓
7. Aider + Gemini generates code autonomously
        ↓
8. Changes committed and pushed to new branch
        ↓
9. Bot displays StackBlitz live preview
        ↓
10. User approves or rejects via Discord buttons
        ↓
11a. [APPROVE] → PR created and merged into main
        ↓
11b. [REJECT] → Branch deleted, changes discarded
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 22.x or higher
- **Docker** (for containerized workers)
- **Git** (2.x or higher)
- **Discord Bot Token** (from Discord Developer Portal)
- **GitHub Personal Access Token** (with repo permissions)
- **Gemini API Key** (from Google AI Studio)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/ShatadruM/GhostCoder.git
cd GhostCoder
```

#### 2. Set Up Environment Variables

Create a `.env` file in the `discord-bot/` directory:
```bash
cd discord-bot
cat > .env << EOF
DISCORD_BOT_TOKEN=your_discord_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

#### 3. Build Docker Worker Image
```bash
cd ../worker-image
docker build -t openclaw-poc:latest .
```

#### 4. Install Dependencies (Discord Bot)
```bash
cd ../discord-bot
npm install
```

#### 5. Launch the Discord Bot
```bash
npm start
# Or: node index.js
```

You should see:
```
Ghost Coder Bot is online as YourBotName#0000
```

---

## 📖 Usage

### Initiate a Task

1. **In your Discord server**, send:
   ```
   !init
   ```

2. **Provide your GitHub PAT** (Personal Access Token):
   - Reply with your token (message auto-deleted for security)
   - Required scopes: `repo`, `workflow`

3. **Specify the repository**:
   ```
   https://github.com/username/my-repo.git
   ```

4. **Describe your coding task**:
   ```
   Add user authentication with JWT tokens to the API
   ```
   - Be descriptive; AI performance improves with clear context
   - Include requirements, constraints, and tech preferences

5. **Review in StackBlitz**:
   - Click the provided link to preview changes in real-time
   - Test the code directly in the browser

6. **Approve or Reject**:
   - **✅ Approve & Raise PR**: Creates pull request, merges to main (after review)
   - **❌ Reject & Delete**: Discards changes, deletes branch

---

## 📁 Project Structure

```
GhostCoder/
├── discord-bot/                 # Discord bot & orchestration
│   ├── index.js                # Main bot logic, state machine
│   ├── dockerManager.js         # Docker & GitHub integration
│   ├── Dockerfile               # Bot container (production)
│   └── package.json             # Dependencies

├── worker-image/                # AI-powered code worker
│   ├── runner.js                # Git & Aider pipeline executor
│   ├── index.js                 # Model availability checker
│   ├── openclaw.config.json     # LLM & security configuration
│   ├── Dockerfile               # Worker container
│   └── package.json             # Dependencies

└── README.md                    # This file
```

---

## 🔧 Configuration

### Bot Configuration
The bot uses **discord.js v14.25.1** with minimal config:
- **Intents**: Guilds, GuildMessages, MessageContent
- **State Management**: In-memory session tracking per user
- **Button Component Timeout**: 10 minutes (600,000ms)

### Worker Configuration (`openclaw.config.json`)
```json
{
  "mode": "headless",
  "llm": {
    "provider": "google",
    "model": "gemini-1.5-pro",
    "temperature": 0.1
  },
  "skills": ["fs", "shell"],
  "security": {
    "allow_shell_commands": true,
    "sandbox_mode": false
  }
}
```

| Parameter | Description |
|-----------|-------------|
| `mode` | Headless execution (no UI) |
| `provider` | AI model provider (Google) |
| `model` | LLM model ID |
| `temperature` | 0.1 = deterministic outputs |
| `allow_shell_commands` | Execute system commands |
| `sandbox_mode` | Disabled for production (use caution) |

---

## 🔐 Security Considerations

### Token Handling
- ✅ GitHub tokens **never logged** to console
- ✅ Tokens stored **in-memory** only (not persisted)
- ✅ User messages containing tokens are **auto-deleted** from Discord
- ✅ Worker containers run in **isolated environments**

### Recommendations
1. **Limit PAT Scopes**: Use minimal required permissions (`repo`, `workflow`)
2. **Rotate Tokens**: Regenerate GitHub tokens periodically
3. **Network Security**: Run bot behind VPN/firewall in production
4. **Docker Resources**: Set memory limits (default: 1GB per container)
5. **API Keys**: Never commit `.env` files to Git

---

## 🛠️ Development

### Local Testing
```bash
# Test bot connectivity
node discord-bot/index.js

# Build worker image
docker build -t openclaw-poc:latest worker-image/

# Test Aider pipeline manually
docker run -e GITHUB_TOKEN=xxx -e REPO_URL=xxx openclaw-poc:latest
```

### Debugging
- **Bot logs**: Check `stdout` for Discord.js events
- **Worker logs**: Piped to Discord channel in real-time
- **Docker logs**: `docker logs <container_id>`

### Common Issues

| Issue | Solution |
|-------|----------|
| **Bot offline** | Check DISCORD_BOT_TOKEN in .env |
| **Worker fails** | Ensure Docker daemon is running |
| **Git auth fails** | Verify GitHub token has `repo` scope |
| **Aider not found** | Rebuild Docker image: `docker build -t openclaw-poc:latest worker-image/` |
| **API key invalid** | Check GEMINI_API_KEY in Discord bot .env |

---

## 📦 Dependencies

### Discord Bot
| Package | Version | Purpose |
|---------|---------|---------|
| `discord.js` | ^14.25.1 | Discord API client |
| `dockerode` | ^4.0.9 | Node.js Docker SDK |
| `@ngrok/ngrok` | ^1.7.0 | Tunnel for webhook callbacks |
| `dotenv` | ^17.3.1 | Environment variable management |

### Worker Image
| Tool | Version | Purpose |
|------|---------|---------|
| `node` | 22-bookworm-slim | JavaScript runtime |
| `python3` | Latest | Python environment for Aider |
| `aider-chat` | Latest | AI-assisted code generation |
| `gh` | Latest | GitHub CLI |
| `git` | 2.x | Version control |

---

## 🚢 Deployment

### Docker Compose (Recommended)
```yaml
version: '3.9'

services:
  discord-bot:
    image: ghostcoder-bot:latest
    environment:
      DISCORD_BOT_TOKEN: ${DISCORD_BOT_TOKEN}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    networks:
      - ghostcoder

  worker-image:
    image: openclaw-poc:latest
    networks:
      - ghostcoder

networks:
  ghostcoder:
    driver: bridge
```

### Cloud Deployment (Google Cloud, AWS, Azure)
1. Build and push images to container registry
2. Deploy bot as service with persistent storage
3. Configure auto-scaling for worker containers
4. Set up monitoring and logging (Cloud Logging, CloudWatch)

---

## 📊 Metrics & Monitoring

Track these metrics for production:
- **Container startup time**: <10 seconds target
- **Code generation latency**: 30-60 seconds typical
- **Git operation success rate**: >99% target
- **PR merge success rate**: Monitor approval ratio
- **Error rates**: Log failures by stage (clone, execute, push)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Areas for Contribution
- [ ] Support for GitLab/Gitea
- [ ] Web dashboard for task monitoring
- [ ] Multi-language support (Python, Go, Rust workers)
- [ ] Advanced PR review with inline comments
- [ ] Scheduled/batch task execution
- [ ] Cost tracking and analytics

---

## 📝 License

This project is licensed under the **ISC License**. See LICENSE file for details.

---

## 🙋 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/ShatadruM/GhostCoder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ShatadruM/GhostCoder/discussions)
- **Discord**: Join our community server (coming soon)

---

## 🎓 Learn More

### Related Technologies
- [Discord.js Documentation](https://discord.js.org/)
- [Aider Documentation](https://aider.chat/)
- [Google Gemini API](https://ai.google.dev/)
- [Docker Documentation](https://docs.docker.com/)

### Similar Projects
- [GitHub Copilot](https://github.com/features/copilot)
- [Devin AI](https://www.devin.ai/)
- [Create PR](https://github.com/create-pr/create-pr)

---

**Built with ❤️ by ShatadruM**

*Ghost Coder: Where AI meets GitHub, and imagination meets implementation.*
