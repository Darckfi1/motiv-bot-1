const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages] });

// Créer une collection pour les commandes
client.commands = new Collection();

// Fonction pour charger les commandes depuis un répertoire
const loadCommands = (dir) => {
    const commandsPath = path.join(__dirname, dir);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
        console.log(`Commande chargée : ${command.data.name}`);
    }
};

// Charger les commandes principales
loadCommands('commands');

// Charger les commandes fun
//loadCommands('commands/fun');

// Gestion des interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Aucune commande trouvée pour ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`Commande exécutée : ${interaction.commandName}`);
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
        await interaction.reply({ 
            embeds: [
                new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('Il y a eu une erreur lors de l\'exécution de la commande.')
            ], 
            ephemeral: true 
        });
    }
});

// Événement lorsque le bot est prêt
client.once(Events.ClientReady, () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    // Définir les commandes pour l'application
    const commands = client.commands.map(command => command.data.toJSON());
    client.application.commands.set(commands)
        .then(() => console.log('Commandes enregistrées'))
        .catch(console.error);
});

client.on('guildMemberAdd', async member => {
    // Lire le fichier logs.json pour obtenir l'ID du salon de bienvenue
    const logsFilePath = path.join(__dirname, './db/logs.json');
    let logsData = {};
    if (fs.existsSync(logsFilePath)) {
        logsData = JSON.parse(fs.readFileSync(logsFilePath, 'utf-8'));
    }

    const welcomeChannelId = logsData[member.guild.id]?.welcomeChannel;
    if (!welcomeChannelId) {
        console.log('Aucun salon de bienvenue configuré.');
        return;
    }

    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    if (!welcomeChannel) {
        console.log('Le salon de bienvenue est introuvable.');
        return;
    }

    // Créer l'embed de bienvenue
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 Bienvenue !')
        .setDescription(`Bienvenue sur le serveur, **${member.user.tag}** ! Nous sommes ravis de t'accueillir. 😊`)
        .setColor('#00FF00')
        .setFooter({ text: `-- Bot by Darckfil -- ${new Date().toLocaleString()} -- ID de l'utilisateur: ${member.user.id}` });


    // Envoyer l'embed dans le salon de bienvenue
    await welcomeChannel.send({ embeds: [welcomeEmbed] });
});

// Connexion du client
client.login(config.token);
