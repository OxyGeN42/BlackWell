const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');

// Railway variables'dan oku
const config = {
    token: process.env.token,
    supportRoles: process.env.supportRoles ? process.env.supportRoles.split(',') : [],
    logChannelId: process.env.logChannelId
};

// Debug
console.log('🔍 Config:', {
    tokenVarMi: !!config.token,
    supportRolesSayisi: config.supportRoles.length,
    logChannelId: config.logChannelId
});

if (!config.token) {
    console.error('❌ HATA: Token bulunamadı!');
    process.exit(1);
}

// Ticket geçmişi için klasör
if (!fs.existsSync('./transcripts')) {
    fs.mkdirSync('./transcripts');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
    console.log(`📊 Sunucu sayısı: ${client.guilds.cache.size}`);
    console.log(`👥 Yetkili roller: ${config.supportRoles.length} rol tanımlandı`);
    client.user.setActivity('🎫 BlackWell Family | Destek Sistemi', { type: 3 });
});

// Yetkili kontrolü
function hasSupportRole(member) {
    return member.roles.cache.some(role => config.supportRoles.includes(role.id));
}

// Ticket paneli oluşturma
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content === '!ticket-panel') {
        try {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Bu komutu kullanmak için yetkiniz yok!');
            }

            const mainEmbed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('🎫 **BlackWell Family | Destek Sistemi**')
                .setDescription(`
> ## **Destek Sistemi Hakkında:**
> Aşağıdaki seçeneklerden uygun olanı seçerek hemen bir ticket oluşturabilirsiniz.
>
> ## **Sunucu Bilgisi:**
> Sunucumuzun kurallarını okumayı unutmayın.
                `)
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazhneW5tdjlqcWczaXB4ZnRrMmR4eGFwcjB2OHlpc21wZnM2MTRxaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MD3VFsgFLey4f6lnyK/giphy.gif')
                .setThumbnail(message.guild.iconURL() || 'https://i.imgur.com/6XU3c6j.png')
                .setFooter({ 
                    text: 'BlackWell Family • Ticket Sistemi', 
                    iconURL: message.guild.iconURL() || 'https://i.imgur.com/6XU3c6j.png' 
                })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_category')
                        .setPlaceholder('📌 Ticket Kategorisi Seçiniz')
                        .addOptions([
                            {
                                label: 'Öneri & Geliştirme Fikirleri',
                                description: 'Oyunculardan gelen fikirler',
                                value: 'suggestion',
                                emoji: '💡'
                            },
                            {
                                label: 'Çiçekçi lazım & Holding lazım',
                                description: 'Eşyalarınızı Bozdurmak Ve Dönüştürmek',
                                value: 'market',
                                emoji: '🏘️'
                            },
                            {
                                label: 'Oyuncu Şikayet & Şikayet',
                                description: 'Kural ihlali yapan oyuncular, Şikayetler',
                                value: 'complaint',
                                emoji: '⚠️'
                            },
                            {
                                label: 'Rütbe Talebi & İşletme Başvurusu',
                                description: 'Aile içi İşletme yükselme istekleri',
                                value: 'rank',
                                emoji: '📈'
                            },
                            {
                                label: 'Aile İçi Sorun & Anlaşmazlık',
                                description: 'Üyeler arası tartışma, problem',
                                value: 'family_issue',
                                emoji: '⚔️'
                            },
                            {
                                label: 'Yetkili İletişim',
                                description: 'BOSS/OG ile özel görüşme',
                                value: 'staff',
                                emoji: '🗣️'
                            }
                        ])
                );

            const clearRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('clear_selection')
                        .setLabel('🧹 Seçimi Temizle')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🧹')
                );

            await message.channel.send({ embeds: [mainEmbed], components: [row, clearRow] });
            await message.delete().catch(() => {});
            
            console.log(`📋 Ticket paneli oluşturuldu: ${message.channel.name}`);
            
        } catch (error) {
            console.error('Panel oluşturma hatası:', error);
            message.reply('❌ Panel oluşturulurken bir hata oluştu!');
        }
    }
});

function getCategoryName(categoryId) {
    const categories = {
        'suggestion': 'Oneri',
        'market': 'Cicekci-Holding',
        'complaint': 'Oyuncu-Sikayet',
        'rank': 'Rutbe-Isletme',
        'family_issue': 'Aile-Ici-Sorun',
        'staff': 'Yetkili-İletisim'
    };
    return categories[categoryId] || 'Ticket';
}

function getCategoryInfo(category) {
    const infos = {
        'suggestion': { 
            color: 0x9B59B6, 
            title: 'Öneri & Geliştirme', 
            desc: 'Fikirleriniz bizim için değerli! En kısa sürede değerlendirilecektir.',
            emoji: '💡'
        },
        'market': { 
            color: 0x3498DB, 
            title: 'Çiçekçi & Holding', 
            desc: 'Eşya dönüşüm ve bozdurma işlemleriniz için ticket açtınız.',
            emoji: '🏘️'
        },
        'complaint': { 
            color: 0xE74C3C, 
            title: 'Oyuncu Şikayet', 
            desc: 'Şikayetiniz incelenmek üzere yetkililere iletilmiştir.',
            emoji: '⚠️'
        },
        'rank': { 
            color: 0xF1C40F, 
            title: 'Rütbe & İşletme', 
            desc: 'Başvurunuz değerlendirmeye alınmıştır.',
            emoji: '📈'
        },
        'family_issue': { 
            color: 0xE67E22, 
            title: 'Aile İçi Sorun', 
            desc: 'Sorununuz en kısa sürede çözülecektir.',
            emoji: '⚔️'
        },
        'staff': { 
            color: 0x2ECC71, 
            title: 'Yetkili İletişim', 
            desc: 'BOSS/OG ekibimiz sizinle ilgilenecektir.',
            emoji: '🗣️'
        }
    };
    return infos[category] || infos['suggestion'];
}

// Ticket açma
async function createTicket(interaction, category) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        // Açık ticket var mı?
        const existingTicket = interaction.guild.channels.cache.find(
            c => c.name.includes(interaction.user.username.toLowerCase()) && 
            c.parent?.name === 'BLACKWELL-TICKETLER'
        );

        if (existingTicket) {
            return interaction.editReply({
                content: `❌ Zaten açık bir ticketınız bulunuyor: ${existingTicket}`
            });
        }

        // Ticket kategorisi
        let ticketCategory = interaction.guild.channels.cache.find(
            c => c.name === 'BLACKWELL-TICKETLER' && c.type === ChannelType.GuildCategory
        );
        
        if (!ticketCategory) {
            ticketCategory = await interaction.guild.channels.create({
                name: 'BLACKWELL-TICKETLER',
                type: ChannelType.GuildCategory,
                reason: 'Ticket sistemi için kategori oluşturuldu.'
            });
        }

        const info = getCategoryInfo(category);
        const categoryName = getCategoryName(category);
        const channelName = `ticket-${categoryName}-${interaction.user.username}`.toLowerCase();

        // İzinler
        const permissionOverwrites = [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.AddReactions
                ]
            },
            {
                id: client.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            }
        ];

        // Yetkili rolleri
        for (const roleId of config.supportRoles) {
            if (roleId && roleId.trim() !== '') {
                permissionOverwrites.push({
                    id: roleId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                });
            }
        }

        // Ticket kanalı
        const ticketChannel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategory.id,
            topic: `Ticket Sahibi: ${interaction.user.tag} | Kategori: ${info.title} | Açılış: ${new Date().toLocaleString('tr-TR')}`,
            permissionOverwrites: permissionOverwrites
        });

        // Hoşgeldin mesajı - DÜZELTİLDİ (kayma yok)
        const welcomeEmbed = new EmbedBuilder()
            .setColor(info.color)
            .setTitle(`🎫 **${info.title} - BlackWell Family**`)
            .setDescription(`
> ## Merhaba ${interaction.user}! 
> BlackWell Family destek sistemine hoş geldiniz.

╔════════════════════════════════════╗
║        **TICKET BİLGİLERİ**         ║
╠════════════════════════════════════╣
║ **Kategori:** ${info.title} ${info.emoji}
║ **Ticket Sahibi:** ${interaction.user.tag}
║ **Açılış Tarihi:** <t:${Math.floor(Date.now() / 1000)}:F>
║ **Ticket ID:** \`${ticketChannel.id}\`
║ **Yetkili Ekipler:** ${config.supportRoles.map(id => `<@&${id}>`).join(' ')}
╚════════════════════════════════════╝

**📝 Lütfen talebinizi detaylıca açıklayın.**
**⏳ Yetkililer en kısa sürede size yardımcı olacaktır.**

> ⚠️ **NOT:** Ticketınızı sadece yetkililer kapatabilir!
            `)
            .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazhneW5tdjlqcWczaXB4ZnRrMmR4eGFwcjB2OHlpc21wZnM2MTRxaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MD3VFsgFLey4f6lnyK/giphy.gif')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ 
                text: 'BlackWell Family • Ticket Sistemi', 
                iconURL: interaction.guild.iconURL() || 'https://i.imgur.com/6XU3c6j.png' 
            })
            .setTimestamp();

        // Butonlar
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Ticketı Üstlen')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId('transcript_ticket')
                    .setLabel('Kayıt Al')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📄')
            );

        const staffButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Ticketı Kapat (Yetkili)')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

        await ticketChannel.send({
            content: `${interaction.user} | ${config.supportRoles.map(id => `<@&${id}>`).join(' ')}`,
            embeds: [welcomeEmbed],
            components: [buttons]
        });

        await ticketChannel.send({
            content: `🔒 **Yetkili Kullanımı:** Ticketı kapatmak için aşağıdaki butonu kullanın.`,
            components: [staffButtons]
        });

        const successReply = await interaction.editReply({
            content: `✅ Ticketınız başarıyla oluşturuldu: ${ticketChannel}`
        });

        setTimeout(async () => {
            try {
                await successReply.delete();
            } catch (e) {}
        }, 5000);

        // LOG - TICKET AÇILINCA
        if (config.logChannelId) {
            try {
                const logChannel = await client.channels.fetch(config.logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('📬 Yeni Ticket Açıldı - BlackWell Family')
                        .setDescription(`**${interaction.user.tag}** tarafından yeni ticket açıldı!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                            { name: '📂 Kategori', value: `${info.emoji} ${info.title}`, inline: true },
                            { name: '📢 Kanal', value: ticketChannel.toString(), inline: true },
                            { name: '⏰ Açılış', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazhneW5tdjlqcWczaXB4ZnRrMmR4eGFwcjB2OHlpc21wZnM2MTRxaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MD3VFsgFLey4f6lnyK/giphy.gif')
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                    console.log(`✅ Açılış log gönderildi`);
                }
            } catch (error) {
                console.error('❌ Açılış log hatası:', error.message);
            }
        }

    } catch (error) {
        console.error('Ticket açma hatası:', error);
        await interaction.editReply({
            content: '❌ Ticket oluşturulurken bir hata oluştu!'
        });
    }
}

// Menü etkileşimleri
client.on('interactionCreate', async (interaction) => {
    try {
        // SEÇİMİ TEMİZLE
        if (interaction.isButton() && interaction.customId === 'clear_selection') {
            const updatedRow = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_category')
                        .setPlaceholder('📌 Ticket Kategorisi Seçiniz')
                        .addOptions([
                            {
                                label: 'Öneri & Geliştirme Fikirleri',
                                description: 'Oyunculardan gelen fikirler',
                                value: 'suggestion',
                                emoji: '💡'
                            },
                            {
                                label: 'Çiçekçi lazım & Holding lazım',
                                description: 'Eşyalarınızı Bozdurmak Ve Dönüştürmek',
                                value: 'market',
                                emoji: '🏘️'
                            },
                            {
                                label: 'Oyuncu Şikayet & Şikayet',
                                description: 'Kural ihlali yapan oyuncular, Şikayetler',
                                value: 'complaint',
                                emoji: '⚠️'
                            },
                            {
                                label: 'Rütbe Talebi & İşletme Başvurusu',
                                description: 'Aile içi İşletme yükselme istekleri',
                                value: 'rank',
                                emoji: '📈'
                            },
                            {
                                label: 'Aile İçi Sorun & Anlaşmazlık',
                                description: 'Üyeler arası tartışma, problem',
                                value: 'family_issue',
                                emoji: '⚔️'
                            },
                            {
                                label: 'Yetkili İletişim',
                                description: 'BOSS/OG ile özel görüşme',
                                value: 'staff',
                                emoji: '🗣️'
                            }
                        ])
                );

            const clearRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('clear_selection')
                        .setLabel('🧹 Seçimi Temizle')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🧹')
                );

            await interaction.update({
                components: [updatedRow, clearRow]
            });

            const reply = await interaction.followUp({
                content: '🧹 **Seçim temizlendi!** Yeni bir kategori seçebilirsiniz.',
                ephemeral: true
            });
            
            setTimeout(async () => {
                try {
                    await reply.delete();
                } catch (e) {}
            }, 10000);
            
            return;
        }

        // TICKET OLUŞTUR
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
            await createTicket(interaction, interaction.values[0]);
        }

        // BUTON İŞLEMLERİ
        if (interaction.isButton()) {
            // TICKET KAPAT
            if (interaction.customId === 'close_ticket') {
                if (!hasSupportRole(interaction.member)) {
                    const reply = await interaction.reply({
                        content: '❌ Ticket kapatma yetkiniz yok!',
                        ephemeral: true
                    });
                    
                    setTimeout(async () => {
                        try {
                            await reply.delete();
                        } catch (e) {}
                    }, 10000);
                    return;
                }

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_close')
                            .setLabel('Evet, Kapat')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('✅'),
                        new ButtonBuilder()
                            .setCustomId('cancel_close')
                            .setLabel('İptal')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('❌')
                    );

                const reply = await interaction.reply({
                    content: '⚠️ **Ticketı kapatmak istediğinize emin misiniz?**',
                    components: [row],
                    ephemeral: true
                });
                
                setTimeout(async () => {
                    try {
                        await reply.delete();
                    } catch (e) {}
                }, 10000);
            }

            // TICKET ÜSTLEN
            if (interaction.customId === 'claim_ticket') {
                if (!hasSupportRole(interaction.member)) {
                    const reply = await interaction.reply({
                        content: '❌ Bu ticketı üstlenmek için yetkiniz yok!',
                        ephemeral: true
                    });
                    
                    setTimeout(async () => {
                        try {
                            await reply.delete();
                        } catch (e) {}
                    }, 10000);
                    return;
                }

                await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
                    SendMessages: true,
                    ViewChannel: true,
                    ReadMessageHistory: true
                });

                const reply = await interaction.reply({
                    content: `✅ **${interaction.user} ticketı üstlendi!**`
                });
                
                setTimeout(async () => {
                    try {
                        await reply.delete();
                    } catch (e) {}
                }, 10000);
            }

            // KAYIT AL
            if (interaction.customId === 'transcript_ticket') {
                if (!hasSupportRole(interaction.member)) {
                    const reply = await interaction.reply({
                        content: '❌ Bu komutu kullanmak için yetkiniz yok!',
                        ephemeral: true
                    });
                    
                    setTimeout(async () => {
                        try {
                            await reply.delete();
                        } catch (e) {}
                    }, 10000);
                    return;
                }

                const reply = await interaction.reply({
                    content: '📄 Ticket kaydı alınıyor...',
                    ephemeral: true
                });

                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = `TICKET TRANSCRIPT\n`;
                transcript += `═══════════════════════════════\n`;
                transcript += `Kanal: ${interaction.channel.name}\n`;
                transcript += `Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
                transcript += `Alan: ${interaction.user.tag}\n`;
                transcript += `═══════════════════════════════\n\n`;
                
                const messagesArray = Array.from(messages.values());
                messagesArray.reverse().forEach(msg => {
                    const time = msg.createdAt.toLocaleString('tr-TR');
                    transcript += `[${time}] ${msg.author.tag}: ${msg.content || '[Medya/Ek]'}\n`;
                });

                const fileName = `./transcripts/${interaction.channel.name}-${Date.now()}.txt`;
                fs.writeFileSync(fileName, transcript);

                const followUp = await interaction.followUp({
                    content: `✅ Ticket kaydı alındı!`,
                    ephemeral: true,
                    files: [fileName]
                });
                
                setTimeout(async () => {
                    try {
                        await reply.delete();
                        await followUp.delete();
                    } catch (e) {}
                }, 10000);
            }

            // KAPATMA ONAY
            if (interaction.customId === 'confirm_close') {
                const channel = interaction.channel;
                
                // Ticket sahibini bul
                const ticketOwner = channel.name.split('-').pop();
                const ownerUser = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === ticketOwner);
                
                const messages = await channel.messages.fetch({ limit: 100 });
                let transcript = `TICKET TRANSCRIPT\n`;
                transcript += `═══════════════════════════════\n`;
                transcript += `Kanal: ${channel.name}\n`;
                transcript += `Kapanma: ${new Date().toLocaleString('tr-TR')}\n`;
                transcript += `Kapatılan: ${interaction.user.tag}\n`;
                transcript += `═══════════════════════════════\n\n`;
                
                const messagesArray = Array.from(messages.values());
                messagesArray.reverse().forEach(msg => {
                    const time = msg.createdAt.toLocaleString('tr-TR');
                    transcript += `[${time}] ${msg.author.tag}: ${msg.content || '[Medya/Ek]'}\n`;
                });

                const fileName = `./transcripts/${channel.name}-${Date.now()}.txt`;
                fs.writeFileSync(fileName, transcript);

                await interaction.update({ content: '🔒 Ticket kapatılıyor...', components: [] });

                // LOG - TICKET KAPANINCA
                if (config.logChannelId) {
                    try {
                        const logChannel = await client.channels.fetch(config.logChannelId);
                        if (logChannel) {
                            const closeEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('🔒 Ticket Kapatıldı - BlackWell Family')
                                .setDescription(`**${channel.name}** ticketı kapatıldı!`)
                                .addFields(
                                    { name: '📢 Kanal', value: channel.name, inline: true },
                                    { name: '👤 Kapatılan', value: interaction.user.tag, inline: true },
                                    { name: '👤 Ticket Sahibi', value: ownerUser ? ownerUser.user.tag : 'Bilinmiyor', inline: true },
                                    { name: '⏰ Kapanış', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                                )
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExazhneW5tdjlqcWczaXB4ZnRrMmR4eGFwcjB2OHlpc21wZnM2MTRxaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MD3VFsgFLey4f6lnyK/giphy.gif')
                                .setTimestamp();

                            await logChannel.send({
                                embeds: [closeEmbed],
                                files: [{
                                    attachment: fileName,
                                    name: `${channel.name}.txt`
                                }]
                            });
                            
                            console.log(`✅ Kapanış log gönderildi`);
                        }
                    } catch (error) {
                        console.error('❌ Kapanış log hatası:', error.message);
                    }
                }

                setTimeout(() => channel.delete().catch(() => {}), 5000);
            }

            // İPTAL
            if (interaction.customId === 'cancel_close') {
                await interaction.update({ content: '✅ İptal edildi.', components: [] });
            }
        }
    } catch (error) {
        console.error('Etkileşim hatası:', error);
    }
});

client.login(config.token);
