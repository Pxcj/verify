const { ButtonInteraction, Client, AttachmentBuilder, EmbedBuilder } = require('discord.js')
const DB = require('../../models/CaptchaSystem')
const { Captcha } = require('captcha-canvas')

module.exports = {
    data: {
        name: "captcha-btn"
    },
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        const { member, guild } =  interaction;

        DB.findOne({ GuildID: guild.id }, async (err, data) => {
            if(!data) return console.log(`Captcha Disabled for ${guild.name}!`);

            const captcha = new Captcha();
            captcha.async = true;
            captcha.addDecoy();
            captcha.drawTrace();
            captcha.drawCaptcha();

            const captchaAttachment = new AttachmentBuilder(await captcha.png)
            .setName("captcha.png");
            
            const captchaEmbed = new EmbedBuilder()
            .setColor(client.mainColor)
            .setTitle("Captcha Sistem Indosans")
            .setDescription("Mohon Kirim Kode Sebelum 30 Detik\nJika Lebih Dari 30 Detik\nBot Tidak Akan Merespon")
            .setImage('attachment://captcha.png')
interaction.reply({
            content: `Bot Mengirimkan Code Via PM`,
            ephemeral: true,
          });

            try {
                const msg = await member.user.send({files: [captchaAttachment], embeds: [captchaEmbed]})
                
                const wrongCaptchaEmbed = new EmbedBuilder()
                .setColor(client.errorColor)
                .setDescription("🚫 Kode Captcha Salah");

                const filter_ = (message) => {
                    if(message.author.id !== member.id) return;
                    if(message.content === captcha.text) {
                        return true;
                    } else {
                        member.send({embeds: [wrongCaptchaEmbed]})
                    }
                }

                try {
                    const response = await msg.channel.awaitMessages({
                        filter: filter_,
                        max: 1,
                        time: 30*1000,
                        errors: ["time"]});

                    if(response) {
                        DB.findOne({ GuildID: member.guild.id }, async (err, data) => {
                            if(!data) return;
                            if(!data.Role) return;

                            const role = member.guild.roles.cache.get(data.Role)
                            member.roles.add(role)
                            member.user.send("**✅ Akunmu Berhasil Terverifikasi**");
                        })
                    } else {
                        member.user.send("**❌ Kamu Tidak Mengirimkan Kode**");
                    }

                } catch (error) {
                    return console.log(error)
                }

            } catch (error) {
                return console.log(error)
            }
        })
    }
}