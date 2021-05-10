import nodemailer from "nodemailer";

export async function sendEmail(to: string, html: string) {
	// let testAccount = await nodemailer.createTestAccount();

	// console.log("testaccount:", testAccount)

	let transporter = nodemailer.createTransport({
		host: "smtp.ethereal.email",
		port: 587,
		secure: false,
		auth: {
			user: "ryder.gottlieb@ethereal.email",
			pass: "2n84rXPyanwTkzCEe7",
		},
	});

	let info = await transporter.sendMail({
		from: '"Michael Pog" <MichaelPog@gmail.com',
		to: to,
		subject: "Change Password from Lireddit Server",
		html,
	});

	console.log("message sent to: ", info.messageId);
	console.log("preview urls: ", nodemailer.getTestMessageUrl(info));
}

// todo actually send email