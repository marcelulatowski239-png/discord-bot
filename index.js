const help = require("./help");

const levels = require("./level");

const glosowanie = require("./glosowanie");

const rep = require("./rep");

const verify = require("./verify");

const giveaway = require("./giveaway");

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

glosowanie(client);
rep(client);
verify(client);
levels(client);
giveaway(client);
help(client);

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

function getLogChannel() {
  return client.channels.cache.get(LOG_CHANNEL_ID);
}

// ✅ BOT GOTOWY
client.once('ready', () => {
  console.log(`🤖 Bot działa jako ${client.user.tag}`);
});

// 🗑️ Usunięta wiadomość
client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;

  const logChannel = getLogChannel();
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Usunięta wiadomość')
    .setColor(0xff0000)
    .addFields(
      { name: 'Autor', value: `${message.author.tag} (${message.author.id})` },
      { name: 'Kanał', value: `<#${message.channel.id}>` },
      { name: 'Treść', value: message.content || 'Brak treści' }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

// ✏️ Edytowana wiadomość
client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (!newMsg.guild || newMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;

  const logChannel = getLogChannel();
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Edytowana wiadomość')
    .setColor(0xffff00)
    .addFields(
      { name: 'Autor', value: `${newMsg.author.tag} (${newMsg.author.id})` },
      { name: 'Kanał', value: `<#${newMsg.channel.id}>` },
      { name: 'Przed', value: oldMsg.content || 'Brak treści' },
      { name: 'Po', value: newMsg.content || 'Brak treści' }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

// 👋 Join
client.on('guildMemberAdd', (member) => {
  const logChannel = getLogChannel();
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🟢 Nowy użytkownik')
    .setColor(0x00ff88)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Użytkownik', value: member.user.tag },
      { name: 'ID', value: member.id }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

// 🚪 Leave
client.on('guildMemberRemove', (member) => {
  const logChannel = getLogChannel();
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🔴 Użytkownik opuścił serwer')
    .setColor(0xff5555)
    .addFields(
      { name: 'Użytkownik', value: member.user.tag },
      { name: 'ID', value: member.id }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
});

// 🚀 NAJWAŻNIEJSZE – logowanie bota
client.login(process.env.TOKEN);

const PREFIX = "!";
const warns = new Map();

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const member = message.mentions.members.first();

    // ================= PERMISJE MODERATORA =================
    if (
        ["kick", "ban", "mute", "unmute", "warn", "unban"].includes(cmd) &&
        !message.member.permissions.has("Administrator")
    ) {
        return message.reply("❌ Nie masz permisji do używania tej komendy.");
    }

    // ================= KICK =================
    if (cmd === "kick") {
        if (!member) return message.reply("Użycie: !kick @user");

        if (!member.kickable)
            return message.reply("❌ Nie mogę wyrzucić tej osoby (wyższa rola).");

        try {
            await member.kick();
            message.channel.send(`👢 ${member.user.tag} został wyrzucony.`);
        } catch (err) {
            console.log(err);
            message.reply("❌ Błąd przy kick.");
        }
    }

    // ================= BAN =================
    if (cmd === "ban") {
        if (!member) return message.reply("Użycie: !ban @user");

        if (!member.bannable)
            return message.reply("❌ Nie mogę zbanować tej osoby.");

        try {
            await member.ban();
            message.channel.send(`🔨 ${member.user.tag} został zbanowany.`);
        } catch (err) {
            console.log(err);
            message.reply("❌ Błąd przy ban.");
        }
    }

    // ================= UNBAN =================
    if (cmd === "unban") {
        const userId = args[0];
        if (!userId) return message.reply("Użycie: !unban ID");

        try {
            await message.guild.members.unban(userId);
            message.channel.send(`✅ Odbanowano użytkownika o ID: ${userId}`);
        } catch (err) {
            console.log(err);
            message.reply("❌ Nie mogę odbanować tej osoby.");
        }
    }

    // ================= MUTE =================
    if (cmd === "mute") {
        if (!member) return message.reply("Użycie: !mute @user 10m");

        const ms = require("ms");
        const time = args[0] || "10m";

        if (!member.moderatable)
            return message.reply("❌ Nie mogę wyciszyć tej osoby.");

        try {
            await member.timeout(ms(time));
            message.channel.send(`🔇 ${member.user.tag} wyciszony na ${time}`);
        } catch (err) {
            console.log(err);
            message.reply("❌ Błąd przy mute.");
        }
    }
// ================= CLEAR =================
if (cmd === "clear") {
    if (!message.member.permissions.has("Administrator")) {
        return message.reply("❌ Nie masz permisji do tej komendy.");
    }

    const amount = parseInt(args[0]);

    if (!amount || amount < 1 || amount > 100) {
        return message.reply("Użycie: !clear 1-100");
    }

    try {
        await message.channel.bulkDelete(amount, true);
        message.channel.send(`🧹 Usunięto ${amount} wiadomości.`)
            .then(msg => setTimeout(() => msg.delete(), 3000));
    } catch (err) {
        console.log(err);
        message.reply("❌ Nie mogę usunąć wiadomości (starsze niż 14 dni?).");
    }
}

    // ================= UNMUTE =================
    if (cmd === "unmute") {
        if (!member) return message.reply("Użycie: !unmute @user");

        if (!member.moderatable)
            return message.reply("❌ Nie mogę odciszyć tej osoby.");

        try {
            await member.timeout(null);
            message.channel.send(`🔊 ${member.user.tag} został odciszony.`);
        } catch (err) {
            console.log(err);
            message.reply("❌ Błąd przy unmute.");
        }
    }

    // ================= WARN SYSTEM =================
    if (cmd === "warn") {
        if (!member) return message.reply("Użycie: !warn @user powod");

        const reason = args.slice(1).join(" ") || "Brak powodu";
        const userId = member.id;

        if (!warns.has(userId)) warns.set(userId, 0);
        warns.set(userId, warns.get(userId) + 1);

        const count = warns.get(userId);

        message.channel.send(
            `⚠️ ${member.user.tag} otrzymał warna (${count}/3)\nPowód: ${reason}`
        );

        // AUTO MUTE PO 3 WARNACH
        if (count >= 3) {
            try {
                 await member.timeout(24 * 60 * 60 * 1000);
                warns.set(userId, 0);
                message.channel.send("🔇 Auto mute na 1 dzień (3 warny).");
            } catch (err) {
                console.log(err);
            }
        }
    }

});

// ====== SYSTEM WELCOME / LEAVE / BOOST + RESET (NOWY, STABILNY) ======

const OWNER_ID = "977677800330899466";

let welcomeChannelId = null;
let leaveChannelId = null;
let boostChannelId = null;

client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;

    // ===== RESET BOTA =====
    if (message.content === "!reset") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Tylko właściciel bota może użyć tej komendy!");
        }

        await message.reply("♻️ Restartuję bota...");
        console.log("🔁 Bot zrestartowany komendą !reset");
        process.exit(0); // hosting musi mieć auto-restart (np. Node, Pterodactyl, VPS)
    }

    // ===== USTAW WELCOME =====
    if (message.content.startsWith("!ustawwelcome")) {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Musisz mieć Administratora!");
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("❌ Oznacz kanał! np: !ustawwelcome #welcome");
        }

        welcomeChannelId = channel.id;
        return message.reply(`✅ Ustawiono kanał powitań na ${channel}`);
    }

    // ===== USTAW LEAVE =====
    if (message.content.startsWith("!ustawleave")) {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Musisz mieć Administratora!");
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("❌ Oznacz kanał! np: !ustawleave #pozegnania");
        }

        leaveChannelId = channel.id;
        return message.reply(`👋 Ustawiono kanał pożegnań na ${channel}`);
    }

    // ===== USTAW BOOST =====
    if (message.content.startsWith("!ustawboost")) {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Musisz mieć Administratora!");
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("❌ Oznacz kanał! np: !ustawboost #boosty");
        }

        boostChannelId = channel.id;
        return message.reply(`🚀 Ustawiono kanał boostów na ${channel}`);
    }
});

// ===== EVENT: WELCOME =====
client.on("guildMemberAdd", async (member) => {
    if (!welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    channel.send(`👋 Witaj ${member} na serwerze **${member.guild.name}**! 🎉`);
});

// ===== EVENT: LEAVE =====
client.on("guildMemberRemove", async (member) => {
    if (!leaveChannelId) return;

    const channel = member.guild.channels.cache.get(leaveChannelId);
    if (!channel) return;

    channel.send(`😢 ${member.user.tag} opuścił serwer...`);
});

// ===== EVENT: BOOST =====
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (!boostChannelId) return;

    if (!oldMember.premiumSince && newMember.premiumSince) {
        const channel = newMember.guild.channels.cache.get(boostChannelId);
        if (!channel) return;

        channel.send(`🚀 ${newMember} właśnie zboostował serwer! 💜`);
    }
});

require("./ticket.js")(client);