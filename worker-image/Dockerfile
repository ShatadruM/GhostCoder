FROM node:22-bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive

# Install base tools, Python, Aider dependencies, AND the GitHub CLI
RUN apt-get update && apt-get install -y \
    git curl python3 python3-pip build-essential ca-certificates gnupg lsb-release cmake \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
ENV PYTHON=/usr/bin/python3
RUN npm install --no-audit --no-fund

# Install Aider
RUN pip3 install aider-chat --break-system-packages

COPY . .
EXPOSE 3000
CMD ["npm", "start"]