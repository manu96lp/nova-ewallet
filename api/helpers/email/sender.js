require( "dotenv" ).config( );

const nodemailer = require( "nodemailer" );
const buildTemplate = require( "./templating" );

const { GMAIL_USER, GMAIL_PASSWORD } = process.env;

async function sendMail( { to, subject, template, input } )
{
	const transporter = nodemailer.createTransport( {
		service: "gmail",
		auth: {
			user: `${ GMAIL_USER }`,
			pass: `${ GMAIL_PASSWORD }`
		}
	} );
	
	const options = {
		from: `"Henry Bank" <${ GMAIL_USER }>`,
		html: await buildTemplate( template, input ),
		to,
		subject
	};
	
	transporter.sendMail( options, ( error, response ) => {
		if ( error ) {
			console.log( error );
		}
	} );
}

module.exports = sendMail;