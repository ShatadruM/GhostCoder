require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { spawnWorkerAndPush, createPullRequest, deleteBranch } = require('./dockerManager');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('clientReady', () => {
    console.log(`Ghost Coder Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!fix')) return;

    const args = message.content.split(' ').slice(1);
    if (args.length < 3 || !args[1].startsWith('http')) {
        return message.reply("❌ **Invalid format.** Use: `!fix <github_token> <repo_url> <task>`");
    }

    const githubToken = args[0];
    const repoUrl = args[1]; // e.g., https://github.com/ShatadruM/test-test.git
    const userTask = args.slice(2).join(' ');

    // Extract Owner and Repo from URL for the API and StackBlitz
    const urlObj = new URL(repoUrl);
    const pathParts = urlObj.pathname.replace('.git', '').split('/').filter(Boolean);
    const repoOwner = pathParts[0];
    const repoName = pathParts[1];

    const reply = await message.reply("⚙️ Spinning up Ghost Coder container. Please wait...");

    try {
        const branchName = await spawnWorkerAndPush(githubToken, repoUrl, userTask);

        // Generate the StackBlitz Cloud IDE Preview Link
        const stackBlitzUrl = `https://stackblitz.com/github/${repoOwner}/${repoName}/tree/${branchName}`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('approve').setLabel('Approve & Raise PR').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('reject').setLabel('Reject & Delete').setStyle(ButtonStyle.Danger)
        );

        await reply.edit({
            content: `✅ **Code edited and pushed to branch!**\n🔗 **Live Cloud Preview:** ${stackBlitzUrl}\n\nPlease review the changes running in the browser and approve to raise the PR.`,
            components: [row]
        });

        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: "Only the requester can approve this task.", ephemeral: true });
            }

            if (interaction.customId === 'approve') {
                await interaction.update({ content: "🚀 Raising Pull Request via GitHub API...", components: [] });
                const prData = await createPullRequest(githubToken, repoOwner, repoName, branchName, userTask);
                await message.channel.send(`✅ **PR Raised Successfully!**\n🔗 View PR: ${prData.html_url}`);
            } else if (interaction.customId === 'reject') {
                await interaction.update({ content: "🗑️ Fix rejected. Deleting remote branch...", components: [] });
                await deleteBranch(githubToken, repoOwner, repoName, branchName);
                await message.channel.send(`🛑 Branch deleted and code discarded.`);
            }
        });

    } catch (error) {
        console.error(error);
        await reply.edit(`❌ An internal server error occurred: ${error.message}`);
    }
});

client.login(process.env.DISCORD_TOKEN);